import "./Dashboard.css"

function Dashboard({ user }) {
    return (
        <section className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">PROPFOLIO</p>
                    <h1>Sveiks, {user?.username}!</h1>
                    <p>
                        Šeit varēsi pārvaldīt savus īpašumus un investīciju analīzes.
                    </p>
                </div>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <div>
                        <h2>Mani īpašumi</h2>
                        <p>Tavi saglabātie nekustamie īpašumi parādīsies šeit.</p>
                    </div>

                    <button type="button">
                        + Pievienot īpašumu
                    </button>
                </div>

                <div className="empty-properties">
                    <h3>Šeit vēl nac saglabātu īpašumu</h3>
                    <p>
                        Nākamajā solī piesaistīsim tavu tikko veikto investīcijas
                        aprēķinu šim profilam.
                    </p>
                </div>
            </div>
        </section>
    );
}

export default Dashboard;
