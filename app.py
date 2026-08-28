import streamlit as st

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

    if st.button("← Atpakaļ"):
        st.session_state["financing"] = None
        st.rerun()
