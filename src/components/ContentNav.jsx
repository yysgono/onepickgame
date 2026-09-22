import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ContentNav.css";

export default function ContentNav({ active, user, authChecked = true }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || "en").split("-")[0];

  const items = [
    {
      key: "worldcup",
      icon: "🏆",
      title: t("presetNavigation.myBrackets", "내 이상형 월드컵"),
      description: "내가 만든 월드컵 보기",
      to: `/${lang}/my-worldcups`,
    },
    {
      key: "tier-list",
      icon: "📊",
      title: t("presetNavigation.myTierLists", "내가 만든 티어표"),
      description: "내가 만든 티어표 보기",
      to: `/${lang}/tier-list?mine=1`,
    },
    {
      key: "quiz",
      icon: "❓",
      title: lang === "ko" ? "퀴즈 맞히기" : t("gameModeNav.quiz", "Quiz"),
      description: lang === "ko" ? "퀴즈 맞히기 보기" : t("gameModeNav.quizDesc", "Play quizzes"),
      to: `/${lang}/quiz`,
    },
  ];

  return (
    <section className="content-hub">
      <div className="content-hub-heading">
        <h1>{t("lightUi.myContent", "내 콘텐츠")}</h1>
        <p>
          {t(
            "lightUi.manageContent",
            "월드컵, 티어표, 퀴즈 콘텐츠를 한곳에서 확인하세요."
          )}
        </p>
      </div>

      <nav
        className="content-type-nav"
        aria-label={t("lightUi.myContent", "내 콘텐츠")}
      >
        {items.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className={`content-type-card content-type-${item.key}${
              active === item.key ? " is-active" : ""
            }`}
            aria-current={active === item.key ? "page" : undefined}
          >
            <span className="content-type-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="content-type-copy">
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <span className="content-type-arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </nav>

      {authChecked && !user && (
        <p className="content-login-hint">
          {t("lightUi.loginToView", "로그인하면 내가 만든 콘텐츠를 확인할 수 있습니다.")} {" "}
          <Link to={`/${lang}/login`}>{t("auth.loginSignup")}</Link>
        </p>
      )}
    </section>
  );
}
