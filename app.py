import streamlit as st


st.set_page_config(
    page_title="Nekustamā īpašuma investīciju kalkulators",
    page_icon="🏠",
    layout="centered"
)

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

with col2:
    cash = st.button(
        "💶 Par saviem līdzekļiem",
        use_container_width=True
    )
