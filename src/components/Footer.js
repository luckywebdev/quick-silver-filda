import React, { useContext, useEffect, useState } from 'react'
import {Container, Row, Col, DropdownButton, Dropdown, Modal} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import styles from './Footer.module.scss'
import { ReactComponent as SecuritySVG } from '../images/security.svg'
import logo from '../images/logo.svg'
import auditLogo from '../images/audit.png'
import { FaGithub, FaWeixin, FaTwitter, FaTelegramPlane, FaHeart } from 'react-icons/fa'
import { LanguageContext } from '../context'
import { NavLink, useLocation } from 'react-router-dom'
import classNames from 'classnames'

const LanguageList = [
  {
    key: "en",
    name: "English",
  },
  {
    key: "zh-CN",
    name: "中文",
  }
]

function Footer() {
  const { t, i18n } = useTranslation()
  const { setLanguage } = useContext(LanguageContext)
  const { pathname } = useLocation()

  useEffect(() => {
    setLanguage(i18n.language)
  }, [i18n.language])

  const changeLanguage = code => {
    i18n.changeLanguage(code)
    setLanguage(code)
  }

  let title = 'English'
  const items = []
  for(let language of LanguageList) {
    if (language.key === i18n.language) {
      title = language.name
    }
    items.push(<Dropdown.Item key={language.key} onClick={() => changeLanguage(language.key)}>{language.name}</Dropdown.Item>)
  }

  if (pathname === '/aboutus') {
    localStorage.setItem('clicked_aboutUs', 'clicked')
  }

  const aboutUsCSS = classNames({
    [styles.links]: true,
    [styles.news]: !localStorage.getItem('clicked_aboutUs')
  })

  return (
    <div className={styles.footer}>
      <Container>
        <Row className={styles.footerRow}>
          <Col lg={4} md={6} sm={12} className={styles.footerMenu}>
            <DropdownButton
              key="up"
              id="language-selector"
              drop="up"
              variant="savings"
              title={title}>
              {items}
            </DropdownButton>
            <div className={classNames(aboutUsCSS)}>
              <NavLink to="/aboutus"> {t('Footer.About')}</NavLink>
              {/* <a href="/">{t('Footer.Forums')}</a>
              <a href="/">{t('Footer.Vote')}</a> */}
            </div>
            <div className={styles.links}>
              <a href="https://info.mdex.com/#/token/0xe36ffd17b2661eb57144ceaef942d95295e637f0" target="_blank">
                {t('Footer.Exchange')}
              </a>
            </div>
            <div className={styles.links}>
              <a href="https://filda-1.gitbook.io/filda/" target="_blank">{t('Footer.Docs')}</a>
            </div>
            <div className={styles.links}>
              {/* <a href="/liquidate">{t('Footer.Liquidation')}</a> */}
              <NavLink to="/liquidate">{t('Footer.Liquidation')}</NavLink>
            </div>
          </Col>
          <Col lg={4} md={3} sm={12} className={styles.community}>
            <div className={styles.links}>
              <a href="https://github.com/fildaio/FilDA" target="_blank"><FaGithub /></a>
            </div>
            <div className={styles.links}>
              <a href="Wechat.jpeg" target="_blank"><FaWeixin /></a>
            </div>
            <div className={styles.links}>
              <a href="https://twitter.com/fildafinance" target="_blank"><FaTwitter /></a>
            </div>
            <div className={styles.links}>
              <a href="https://t.me/FilDAcommunity" target="_blank"><FaTelegramPlane /></a>
            </div>
            <div className={styles.links}>
            <a href="https://docs.filda.io/dai-ma-code/shen-ji-audit" target="_blank"><SecuritySVG /></a>
            </div>
          </Col>
          <Col lg={4} md={3} sm={12} className={styles.poweredBy}>
            <div className={styles.poweredByText}> made with <FaHeart className={styles.heart} /> by FilDA Team </div>
            <div className={styles.darkVersion}>{`version-${process.env.REACT_APP_VERSION}`}</div>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Footer
