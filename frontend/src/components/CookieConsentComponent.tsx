import React, { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

export const CookieConsentComponent: React.FC = () => {
  useEffect(() => {
    // 检查是否已经初始化，防止在 React 19 StrictMode 下重复渲染/初始化报错
    const container = document.getElementById('cc-main');
    if (container) return;

    CookieConsent.run({
      guiOptions: {
        consentModal: {
          layout: 'box',
          position: 'bottom right',
          equalWeightButtons: true,
          flipButtons: false
        },
        preferencesModal: {
          layout: 'box',
          position: 'right',
          equalWeightButtons: true,
          flipButtons: false
        }
      },
      categories: {
        necessary: {
          readOnly: true
        },
        analytics: {}
      },
      language: {
        default: 'zh',
        translations: {
          zh: {
            consentModal: {
              title: '📢 Cookie 同意声明',
              description: '本平台（LIGHT IN THE BRAIN）使用 Cookie 来改善您的浏览偏好并分析网站流量。继续浏览即代表您同意我们的 Cookie 政策。',
              acceptAllBtn: '接受全部',
              acceptNecessaryBtn: '仅必要',
              showPreferencesBtn: '偏好设置'
            },
            preferencesModal: {
              title: 'Cookie 偏好设置中心',
              acceptAllBtn: '接受全部',
              acceptNecessaryBtn: '仅必要',
              savePreferencesBtn: '保存偏好设置',
              closeIconLabel: '关闭',
              sections: [
                {
                  title: '必要型 Cookie',
                  description: '这些 Cookie 对于网站的正常安全运行是必不可少的，例如用户鉴权与人机验证。',
                  linkedCategory: 'necessary'
                },
                {
                  title: '分析型 Cookie',
                  description: '用于收集网站流量与使用数据，以帮助我们改进硬科技研究平台的用户体验。',
                  linkedCategory: 'analytics'
                }
              ]
            }
          },
          en: {
            consentModal: {
              title: '📢 Cookie Consent Notice',
              description: 'We use cookies to improve your browsing experience and analyze site traffic. By continuing to browse, you agree to our Cookie Policy.',
              acceptAllBtn: 'Accept All',
              acceptNecessaryBtn: 'Only Necessary',
              showPreferencesBtn: 'Preferences'
            },
            preferencesModal: {
              title: 'Cookie Preference Center',
              acceptAllBtn: 'Accept All',
              acceptNecessaryBtn: 'Only Necessary',
              savePreferencesBtn: 'Save Settings',
              closeIconLabel: 'Close',
              sections: [
                {
                  title: 'Strictly Necessary Cookies',
                  description: 'These cookies are essential for security and website operations, such as auth tokens and captchas.',
                  linkedCategory: 'necessary'
                },
                {
                  title: 'Analytical Cookies',
                  description: 'Used to gather traffic insights to help us continuously optimize our tech VC portal experience.',
                  linkedCategory: 'analytics'
                }
              ]
            }
          }
        }
      }
    });
  }, []);

  return null;
};
