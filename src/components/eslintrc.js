module.exports = {
  extends: ["react-app", "react-app/jest"],
  plugins: ["react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error",       // Hook 규칙 강제
    "react-hooks/exhaustive-deps": "warn"        // deps 배열 검사 (경고)
  }
};
