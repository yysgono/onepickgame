import COLORS from "./theme";

export const cardBoxStyle = {
  background: `linear-gradient(145deg, #fff 88%, #e3f0fb 100%)`,
  borderRadius: 20,
  boxShadow: "0 4px 24px #1976ed22, 0 2px 12px #b4c4e4",
  overflow: "hidden",
  minHeight: 360,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  padding: 0,
  margin: "0 auto",
  cursor: "pointer",
  transition: "box-shadow 0.17s, transform 0.18s cubic-bezier(.22,.68,.5,1.01)",
  position: "relative"
};

export const mainButtonStyle = (isMobile) => ({
  flex: 1,
  background: `linear-gradient(90deg, ${COLORS.main} 60%, ${COLORS.sub} 100%)`,
  color: "#fff",
  fontWeight: 700,
  fontSize: isMobile ? 14 : 17,
  border: "none",
  borderRadius: 999,
  padding: isMobile ? "10px 0" : "12px 0",
  cursor: "pointer",
  boxShadow: "0 2px 10px #a5d5ff30",
  transition: "background 0.18s",
});

export const subButtonStyle = (isMobile) => ({
  flex: 1,
  background: "#e6f1fd",
  color: "#206eb2",
  fontWeight: 700,
  fontSize: isMobile ? 14 : 17,
  border: "none",
  borderRadius: 999,
  padding: isMobile ? "10px 0" : "12px 0",
  cursor: "pointer",
  boxShadow: "0 2px 8px #b1d4ff20"
});

export const grayButtonStyle = (isMobile) => ({
  background: COLORS.gray,
  color: "#fff",
  border: "none",
  borderRadius: 9,
  fontWeight: 700,
  fontSize: isMobile ? 12 : 14,
  padding: isMobile ? "7px 10px" : "7px 15px",
  cursor: "pointer"
});

export const editButtonStyle = (isMobile) => ({
  background: COLORS.edit,
  color: "#fff",
  border: "none",
  borderRadius: 9,
  fontWeight: 700,
  fontSize: isMobile ? 12 : 14,
  padding: isMobile ? "7px 10px" : "7px 15px",
  cursor: "pointer"
});

export const delButtonStyle = (isMobile) => ({
  background: COLORS.danger,
  color: "#fff",
  border: "none",
  borderRadius: 9,
  fontWeight: 700,
  fontSize: isMobile ? 12 : 14,
  padding: isMobile ? "7px 10px" : "7px 15px",
  cursor: "pointer"
});

export const selectStyle = (isMobile) => ({
  border: "1.5px solid #bbb",
  background: "#fff",
  borderRadius: isMobile ? 9 : 16,
  fontWeight: 700,
  fontSize: isMobile ? 14 : 22,
  padding: isMobile ? "8px 15px" : "12px 30px",
  color: "#222",
  cursor: "pointer",
  outline: "none",
});
