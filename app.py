import streamlit as st
from backend.calculations import (
    calculate_price_per_m2,
    calculate_notary_fee,
    calculate_notary_vat,
    calculate_state_fee,
    calculate_additional_purchase_costs,
    calculate_total_purchase_cost
)

st.set_page_config(
    page_title="Nekustamā īpašuma investīciju kalkulators",
    page_icon="🏠",
    layout="centered"
)

# Izvēlamies finansēšanas scenāriju
if "financing" not in st.session_state:
    st.session_state["financing"] = None


# ----------------------------------------
# Sākuma ekrāns
# ----------------------------------------

if st.session_state["financing"] is None:

    st.title("Vai šis īpašums ir labs ieguldījums?")

    st.write(
        "Aprēķini potenciālo atdevi no dzīvokļa iegādes "
        "un izvērtē, cik izdevīgs ir šis ieguldījums."
    )

    st.subheader("Kā plāno finansēt šo investīciju?")

    col1, col2 = st.columns(2)

    with col1:
        mortgage = st.button(
            "🏦 Ar hipotēku",
            use_container_width=True
        )

        if mortgage:
            st.session_state["financing"] = "mortgage"
            st.rerun()

    with col2:
        cash = st.button(
            "💶 Par saviem līdzekļiem",
            use_container_width=True
        )

        if cash:
            st.session_state["financing"] = "cash"
            st.rerun()


# ----------------------------------------
# Skaidras naudas scenārijs
# ----------------------------------------

elif st.session_state.financing == "cash":

    st.title("Investīcija ar saviem līdzekļiem")

    st.write(
        "Ievadi informāciju par dzīvokli, lai aprēķinātu "
        "potenciālo investīcijas atdevi."
    )

    # Pirmā sadaļa - Īpašuma pamatinformācija
    # ----------------------------------------

    st.subheader("🏠 Īpašuma pamatinformācija")

    purchase_price = st.number_input(
        "Īpašuma iegādes cena (€)",
        min_value=0,
    )

    area = st.number_input(
        "Platība (m²)",
        min_value=0,
    )

    price_per_m2 = calculate_price_per_m2(
        purchase_price,
        area
    )

    st.metric(
        "Cena par m²",
        f"{price_per_m2:,.2f} €"
    )

    # Otrā sadaļa - Papildu izdevumi
    # ----------------------------------------

    st.subheader("💶 Īpašuma iegādes papildu izdevumi")

    notary_fee = calculate_notary_fee(purchase_price)

    notary_vat = calculate_notary_vat(notary_fee)

    registry_fee = st.number_input(
        "Kancelejas nodeva (€)",
        min_value=0
    )

    property_valuation = st.number_input(
        "Īpašuma vērtējums (€)",
        min_value=0
    )

    state_fee = calculate_state_fee(purchase_price)

    total_additional_costs = calculate_additional_purchase_costs(
        notary_fee,
        notary_vat,
        registry_fee,
        property_valuation,
        state_fee
    )

    total_purchase_cost = calculate_total_purchase_cost(
        purchase_price,
        total_additional_costs
    )

    st.write(f"**Notārs:** {notary_fee:,.2f} €")
    st.write(f"**Notārs PVN:** {notary_vat:,.2f} €")
    st.write(f"**Valsts nodeva:** {state_fee:,.2f} €")

    st.metric(
        "Kopējie papildu izdevumi",
        f"{total_additional_costs:,.2f} €"
    )

    st.subheader("💰 Kopējie īpašuma iegādes izdevumi")

    st.metric(
        "Kopējā nepieciešamā summa īpašuma iegādei",
        f"{total_purchase_cost:,.2f} €"
    )

    # Atpakaļ poga

    if st.button("← Atpakaļ"):
        st.session_state["financing"] = None
        st.rerun()
