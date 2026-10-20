"""Regression tests use only an isolated in-memory database and temporary files."""
import io
import os
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

os.environ["DATABASE_URL"]="sqlite://"
os.environ["JWT_SECRET_KEY"]="regression-tests-only-secret-key-32-characters"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import database
import gallery
import image_storage
import main
import password_recovery
from auth_limits import _attempts, check_limit
from models import User, Property, GalleryPhoto
from security import create_access_token, hash_password


class RegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = "Original-Password1!"
        cls.hashed = hash_password(cls.password)

    def setUp(self):
        temp_root=Path(__file__).resolve().parent / ".tmp"
        temp_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temp_root)
        self.root = Path(self.temp.name)
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        database.Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine)
        self.patches = [patch.object(database, "SessionLocal", self.sessions),
                        patch.object(image_storage, "PROPERTY_DIR", self.root / "private-properties"),
                        patch.object(image_storage, "LEGACY_PROPERTY_DIR", self.root / "old-properties"),
                        patch.object(gallery, "GALLERY_DIR", self.root / "private-gallery"),
                        patch.object(gallery, "LEGACY_GALLERY_DIR", self.root / "old-gallery"),
                        patch.object(password_recovery, "OUTBOX", self.root / "mail")]
        for item in self.patches:
            item.start()
        with self.sessions() as db:
            for user_id, plan in [(1, "pro"), (2, "pro"), (3, "basic")]:
                db.add(User(id=user_id, username=f"test{user_id}", email=f"test{user_id}@example.com", first_name="Test", last_name="User", plan=plan, password_hash=self.hashed, session_version=0, email_verified_at=datetime.now(timezone.utc)))
            db.flush()
            db.add(Property(property_id=10,user_id=1,property_name="Test property",financing_type="cash",purchase_price=27900,area=39,renovation_cost_per_m2=0))
            db.commit()
        def get_test_db():
            with self.sessions() as db:
                yield db
        main.app.dependency_overrides[database.get_db] = get_test_db
        self.client = TestClient(main.app)
        self.token = create_access_token(1)
        self.client.cookies.set("access_token", self.token)
        _attempts.clear()

    def tearDown(self):
        self.client.close()
        main.app.dependency_overrides.clear()
        for item in reversed(self.patches):
            item.stop()
        self.engine.dispose()
        self.assertEqual(self.root.resolve().parent, (Path(__file__).resolve().parent / ".tmp").resolve())
        self.temp.cleanup()

    def jpeg(self):
        output = io.BytesIO()
        Image.new("RGB", (10, 10), "green").save(output, "JPEG")
        return output.getvalue()

    def upload(self):
        return self.client.post("/properties/10/image",files={"image":("../../unsafe.svg",self.jpeg(),"image/svg+xml")})

    def test_anonymous_cannot_read_files_or_private_records(self):
        self.client.cookies.clear()
        for path in ["/properties", "/properties/10/gallery", "/uploads/gallery/any.jpg", "/uploads/properties/property_10_any.jpg"]:
            self.assertEqual(self.client.get(path).status_code, 401, path)

    def test_property_images_private_and_owner_only(self):
        response = self.upload()
        self.assertEqual(response.status_code, 200, response.text)
        url = response.json()["image_url"]
        self.assertNotIn("unsafe", url)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.client.cookies.set("access_token", create_access_token(2))
        self.assertEqual(self.client.get(url).status_code, 404)
        self.client.cookies.clear()
        self.assertEqual(self.client.get(url).status_code, 401)

    def test_legacy_images_still_work_for_owner(self):
        folder = image_storage.LEGACY_PROPERTY_DIR
        folder.mkdir()
        (folder / "property_10_old.jpg").write_bytes(self.jpeg())
        with self.sessions() as db:
            db.get(Property,10).image_url = "/uploads/properties/property_10_old.jpg"
            db.commit()
        self.assertEqual(self.client.get("/uploads/properties/property_10_old.jpg").status_code,200)

    def test_gallery_legacy_url_cannot_bypass_owner_or_plan(self):
        folder = gallery.LEGACY_GALLERY_DIR
        folder.mkdir()
        (folder / "photo.jpg").write_bytes(self.jpeg())
        with self.sessions() as db:
            db.add(GalleryPhoto(property_id=10,storage_name="photo.jpg",filename="photo.jpg",photo_date=datetime.now().date(),category="initial"))
            db.commit()
        self.assertEqual(self.client.get("/uploads/gallery/photo.jpg").status_code,200)
        self.client.cookies.set("access_token", create_access_token(2))
        self.assertEqual(self.client.get("/uploads/gallery/photo.jpg").status_code,404)
        self.client.cookies.set("access_token", create_access_token(3))
        self.assertEqual(self.client.get("/uploads/gallery/photo.jpg").status_code,403)

    def test_client_cannot_supply_server_file_path(self):
        response = self.client.post("/properties",json={"financing_type":"cash","purchase_price":100,"area":10,"image_url":".env"})
        self.assertEqual(response.status_code,422)

    def test_new_gallery_upload_is_private_and_owner_only(self):
        response=self.client.post('/properties/10/gallery',data={'photo_date':'2026-10-20','category':'initial'},files=[('photos',('photo.jpg',self.jpeg(),'image/jpeg'))])
        self.assertEqual(response.status_code,201,response.text)
        url=response.json()[0]['image_url']
        self.assertEqual(self.client.get(url).status_code,200)
        self.assertEqual(len(list(gallery.GALLERY_DIR.glob('*.jpg'))),1)
        self.client.cookies.set('access_token',create_access_token(2))
        self.assertEqual(self.client.get(url).status_code,404)

    def test_legacy_unsafe_path_is_not_deleted(self):
        guard = self.root / "keep.txt"
        guard.write_text("keep")
        with self.sessions() as db:
            db.get(Property,10).image_url=str(guard)
            db.commit()
        self.assertEqual(self.client.delete("/properties/10/image").status_code,200)
        self.assertEqual(guard.read_text(),"keep")

    def test_rejected_image_keeps_old_file(self):
        old_url=self.upload().json()["image_url"]
        response=self.client.post("/properties/10/image",files={"image":("bad.jpg",b"not an image","image/jpeg")})
        self.assertEqual(response.status_code,415)
        self.assertEqual(self.client.get(old_url).status_code,200)

    def test_negative_price_and_bad_financing_rejected(self):
        for data in [{"financing_type":"cash","purchase_price":-100,"area":39},{"financing_type":"unknown","purchase_price":100,"area":39}]:
            self.assertEqual(self.client.post("/properties",json=data).status_code,422)

    def test_password_change_revokes_old_session_and_keeps_current(self):
        response=self.client.post("/account/profile/password",json={"current_password":self.password,"new_password":"New-Safe-Password2!","confirm_password":"New-Safe-Password2!"})
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(self.client.get("/me").status_code,200)
        self.client.cookies.clear()
        self.client.cookies.set("access_token",self.token)
        self.assertEqual(self.client.get("/me").status_code,401)

    def test_recovery_token_single_use_and_not_an_access_token(self):
        with self.sessions() as db:
            token=password_recovery.recovery_token(db.get(User,1))
        self.client.cookies.set("access_token",token)
        self.assertEqual(self.client.get("/me").status_code,401)
        body={"token":token,"password":"Recovered-Password3!","confirm_password":"Recovered-Password3!"}
        self.assertEqual(self.client.post("/account/password/reset",json=body).status_code,200)
        self.assertEqual(self.client.post("/account/password/reset",json=body).status_code,400)
        self.client.cookies.set("access_token",self.token)
        self.assertEqual(self.client.get("/me").status_code,401)

    def test_reset_request_does_not_reveal_account_presence(self):
        yes=self.client.post("/account/password/request",json={"email":"test1@example.com"})
        no=self.client.post("/account/password/request",json={"email":"missing@example.com"})
        self.assertEqual(yes.json(),no.json())
        self.assertEqual(len(list(password_recovery.OUTBOX.glob("*.html"))),1)

    def test_retry_does_not_create_duplicate_property(self):
        body={"financing_type":"cash","purchase_price":100,"area":10,"client_request_id":"11111111-1111-4111-8111-111111111111"}
        first=self.client.post("/properties",json=body)
        second=self.client.post("/properties",json=body)
        self.assertEqual(first.status_code,200,first.text)
        self.assertEqual(first.json()["property_id"],second.json()["property_id"])
        with self.sessions() as db:
            self.assertEqual(db.query(Property).count(),2)

    def test_failed_commit_keeps_old_image_and_removes_new_file(self):
        old=self.upload().json()["image_url"]
        with patch.object(self.sessions.class_,"commit",side_effect=RuntimeError("test transaction failure")):
            self.assertEqual(self.upload().status_code,500)
        self.assertEqual(self.client.get(old).status_code,200)
        self.assertEqual(len(list(image_storage.PROPERTY_DIR.glob("*.jpg"))),1)

    def test_rate_limit_and_expiry(self):
        check_limit("unit-test",2,now=0)
        check_limit("unit-test",2,now=1)
        with self.assertRaises(main.HTTPException) as context:
            check_limit("unit-test",2,now=2)
        self.assertEqual(context.exception.status_code,429)
        check_limit("unit-test",2,now=62)


if __name__ == "__main__":
    unittest.main()
