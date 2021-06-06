import React, {useEffect, useState} from 'react'
import {Container, Row, Col} from 'react-bootstrap'
import classNames from 'classnames'
import { FaGithub, FaWeixin, FaTwitter, FaTelegramPlane, FaRedditAlien } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import Fade from 'react-reveal/Fade'
import {faqData, roadmapData, partnerData, personData} from './data'
import styles from './index.module.scss'


const AboutUs = () => {
  const { t } = useTranslation()
  const [showFaq, setShowFaq] = useState([])

  const whatIsFilDA = () => {
    return (
      <section className={classNames(styles.sec, styles.whatIsFilDA)}>
          <div className={styles.inner}>
            <Fade right>
              <div className={styles.content}>
                <h2 className={styles.mainTitle}>{t('AboutUs.WhatIsFilDA.title')}</h2>
                <div className={styles.infoList}>
                  <p>{t('AboutUs.WhatIsFilDA.twoFundProto')}</p>
                  <ul>
                    <li>{t('AboutUs.WhatIsFilDA.banking')}</li>
                    <li>{t('AboutUs.WhatIsFilDA.staking')}</li>
                  </ul>
                  <p>{t('AboutUs.WhatIsFilDA.twoProtoAllowUser')}</p>
                  <ul>
                    <li><em>{t('AboutUs.WhatIsFilDA.h.deposit')}</em>{t('AboutUs.WhatIsFilDA.deposit')}</li>
                    <li><em>{t('AboutUs.WhatIsFilDA.h.borrow')}</em>{t('AboutUs.WhatIsFilDA.borrow')}</li>
                    <li><em>{t('AboutUs.WhatIsFilDA.h.stake')}</em>{t('AboutUs.WhatIsFilDA.stake')}</li>
                  </ul>
                </div>
                <div className={styles.info}>
                  <p>{t('AboutUs.WhatIsFilDA.content1')}</p>
                  <p>{t('AboutUs.WhatIsFilDA.content2')}</p>
                </div>
              </div>
            </Fade>
          </div>  
      </section>
    )
  }

  const roadMap = () => {
    const renderRoadItem = () => {
      return roadmapData(t).map((item, index) => (
        <div key={index} className={classNames(styles.road_item, {[styles.road_item_isFuture]: item.isFuture})}>
          <Fade bottom>
            <div className={styles.road_item_content}>
              <div className={styles.road_circle}></div>
              <div className={styles.road_item_hd}>
                <div className={styles.picShadow}></div>
                <div className={styles.pic}></div>
                <div className={styles.h}>
                  <em className={styles.h_date}>{item.date}</em>
                  <div className={styles.h_type_project}>
                    {item.type && <span>{t('AboutUs.roadmap.type')}：{t(item.type)}</span>}
                    {item.name && <span>{t('AboutUs.roadmap.name')}：{t(item.name)}</span>}     
                  </div>
                </div>
              </div>
              <div className={styles.road_item_bd} dangerouslySetInnerHTML={{__html:item.content && t(item.content)}}>
              </div>
            </div>
          </Fade>
        </div>
      ))
    }

    return (
      <section className={classNames(styles.sec, styles.roadMap)}>
        <div className={styles.inner}>
        <div className={styles.content}>
          <Fade bottom>
            <h2 className={styles.mainTitle}>{t('AboutUs.roadmap.title')}</h2>
          </Fade>
          <div className={styles.road_list}>
            <div className={styles.road_line}></div>
            {renderRoadItem()}
          </div>
        </div>
        </div>
      </section>
    )
  }

  const security = () => {
    return (
        <section className={classNames(styles.sec, styles.security)}>
          <div className={styles.inner}>
            <Fade bottom>
              <div className={styles.content}>
                <h2 className={styles.mainTitle}>{t('AboutUs.security.title')}</h2>
                <div className={styles.info_wrapper}>
                  <img src={require('../../images/aboutUs/security.png')}/>
                  <div className={styles.info}>
                    <p>{t('AboutUs.security.content1')}</p>
                    <p>{t('AboutUs.security.list')}</p>
                    <ul>
                      <li>{t('AboutUs.security.item1')} <a href="https://firebasestorage.googleapis.com/v0/b/gitbook-28427.appspot.com/o/assets%2F-MR3imk4nLhqhZQZKgNp%2F-MUkcc4kltYrOSFerm59%2F-MUkdKPhPfB6UkdabhV2%2FFilDA%E6%99%BA%E8%83%BD%E5%90%88%E7%BA%A6%E5%AE%A1%E8%AE%A1%E6%8A%A5%E5%91%8A.pdf?alt=media&amp;token=aa70d0e8-6407-496f-b613-dcaa3fe91d1f">{t('AboutUs.security.item1.link1')}</a>, <a href="https://firebasestorage.googleapis.com/v0/b/gitbook-28427.appspot.com/o/assets%2F-MR3imk4nLhqhZQZKgNp%2F-MTxPz7L9NK0r0YlXWWs%2F-MTynzNRq4567sdCL8aP%2FFilDA%E5%AE%A1%E8%AE%A1%E6%8A%A5%E5%91%8A%E2%80%94FairyProof.pdf?alt=media&amp;token=75961972-7641-4a44-9fa1-4b25419de588">{t('AboutUs.security.item1.link2')}</a>, <a href="https://firebasestorage.googleapis.com/v0/b/gitbook-28427.appspot.com/o/assets%2F-MR3imk4nLhqhZQZKgNp%2F-MUkhrH9dLSuw_qdDIUB%2F-MUkxbHo-RmkgfQcoe_C%2FFilDA%E5%AE%89%E5%85%A8%E5%AE%A1%E8%AE%A1%E2%80%94%E2%80%94%E6%85%A2%E9%9B%BE%E7%A7%91%E6%8A%80.pdf?alt=media&amp;token=29dabe25-97be-488c-9c39-e81c7b37523c">{t('AboutUs.security.item1.link3')}</a></li>
                      <li>{t('AboutUs.security.item2')}</li>
                      <li>{t('AboutUs.security.item3')}</li>
                      <li>{t('AboutUs.security.item4')}</li>
                      <li>{t('AboutUs.security.item5')}</li>
                      <li>{t('AboutUs.security.item6')}</li>
                      <li>{t('AboutUs.security.item7')}</li>
                      <li>{t('AboutUs.security.item8')}</li>
                      <li>{t('AboutUs.security.item9')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </section>
    )
  }


  const supportedAssets = () => {
    return (
      <section className={classNames(styles.sec, styles.supportedAssets)}>
        <div className={styles.inner}>
          <Fade left>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.supportedAssets.title')}</h2>
              <h3 className={styles.subTitle}>{t('AboutUs.supportedAssets.assets')}</h3>
              <div className={styles.info_wrapper}>
                <img src={require('../../images/aboutUs/logo_group.png')}/>
                <div className={styles.info}>
                  <p>{t('AboutUs.supportedAssets.content1')}</p>
                  <p>{t('AboutUs.supportedAssets.content2')}</p>
                </div>
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }


  const lendBorrow = () => {
    return (
      <section className={classNames(styles.sec, styles.lendBorrow)}>
        <div className={styles.inner}>
          <Fade right>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.lendingBorrowing.title')}</h2>
              <h3 className={styles.subTitle}>{t('AboutUs.lendingBorrowing.listhd')}</h3>
              <div className={styles.info_wrapper}>
                <img src={require('../../images/aboutUs/logo_group.png')}/>
                <div className={styles.info}>
                  <p>{t('AboutUs.lendingBorrowing.content1')}</p>
                </div>
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }

  const staking = () => {
    return (
      <section className={classNames(styles.sec, styles.staking)}>
        <div className={styles.inner}>
          <Fade bottom>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.staking.title')}</h2>
              <h3 className={styles.subTitle}>{t('AboutUs.staking.listhd')}</h3>
              <div className={styles.info_wrapper}>
                <div className={styles.info}>
                  <p>{t('AboutUs.staking.content1')}</p>
                  <p>{t('AboutUs.staking.content2')}</p>
                </div>
                <img src={require('../../images/aboutUs/staking.png')}/>
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }

  const dao = () => {
    return (
      <section className={classNames(styles.sec, styles.dao)}>
        <div className={styles.inner}>
          <Fade right>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.dao.title')}</h2>
              <div className={styles.info_wrapper}>
                <div className={classNames(styles.info_item_wrapper, styles.info_item1_wrapper)}>
                  <img src={require('../../images/aboutUs/dao_1.png')}/>
                  <div className={styles.info}>
                    <p>{t('AboutUs.dao.content1')}</p>
                    <p>{t('AboutUs.dao.content2')}</p>
                    <p>{t('AboutUs.dao.content3')}</p>
                  </div>
                </div>
                <div className={classNames(styles.info_item_wrapper, styles.info_item2_wrapper)}>
                  <div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.dao.rewards.hd')}</h3>
                      <p>{t('AboutUs.dao.rewards.bd1')}</p>
                    </div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.dao.framework.hd')}</h3>
                      <p>{t('AboutUs.dao.framework.bd1')}</p>
                      <p>{t('AboutUs.dao.framework.bd2')}</p>
                    </div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.future.votingRules.hd')}</h3>
                      <p>{t('AboutUs.future.votingRules.bd1')}</p>
                    </div>
                  </div>
                  <img src={require('../../images/aboutUs/dao_2.png')}/>
                </div>
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }

  const future = () => {
    return (
      <section className={classNames(styles.sec, styles.future)}>
        <div className={styles.inner}>
          <Fade left>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.future.title')}</h2>
              <div className={styles.info_wrapper}>
                <div className={classNames(styles.info_item_wrapper, styles.info_item1_wrapper)}>
                  <img src={require('../../images/aboutUs/future_1.png')}/>
                  <div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.future.products.hd')}</h3>
                      <p>{t('AboutUs.future.products.bd1')}</p>
                    </div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.future.daoPool.hd')}</h3>
                      <p>{t('AboutUs.future.daoPool.bd1')}</p>
                    </div>
                  </div>
                </div>
                <div className={classNames(styles.info_item_wrapper, styles.info_item2_wrapper)}>
                  <div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.future.marketGovernance.hd')}</h3>
                      <p>{t('AboutUs.future.marketGovernance.bd1')}</p>
                    </div>
                    <div className={styles.info}>
                      <h3>{t('AboutUs.future.votingRules.hd')}</h3>
                      <p>{t('AboutUs.future.votingRules.bd1_1')} (<a href="https://github.com/fildaio/FIPs">https://github.com/fildaio/FIPs</a>). {t('AboutUs.future.votingRules.bd1_2')}</p>
                      <p>{t('AboutUs.future.votingRules.bd2')}</p>
                    </div>
                  </div>
                  <img src={require('../../images/aboutUs/future_2.png')}/>
                </div>
              </div>
            </div>
          </Fade>
          </div>
      </section>
    )
  }


  const faq = () => {

    const handle_toggleFaq = (index) => {
      const copy = [...showFaq]
      copy[index] = !copy[index]
      setShowFaq(copy)
    }

    const render_faqItem = () => (faqData(t).map((item,index) => {
        return (
          <Fade bottom key={index}>
            <li className={classNames(styles.faq_item, showFaq[index] && styles.faq_item_unfold)}>
              <div className={styles.faq_item_q} onClick={() => handle_toggleFaq(index)}>
                <p>{item.Q}</p>
                <i className={showFaq[index] ? styles.faq_item_subicon : styles.faq_item_addicon}></i>
              </div>
              {showFaq[index] && <div className={styles.faq_item_a} dangerouslySetInnerHTML={{__html: item.A}}></div>}
            </li>
          </Fade>
        )
      })
    )
    
    return (
      <section className={classNames(styles.sec, styles.faq)}>
        <div className={styles.inner}>
        <div className={styles.content}>
          <img src={require('../../images/aboutUs/faq.png')}/>
          <Fade bottom>
            <h2 className={styles.mainTitle}>{t('AboutUs.faq.title')}</h2>
          </Fade>
          <div className={styles.faq_list_wrapper}>
            <ul className={styles.faq_list}>
              {render_faqItem()}
            </ul>
            <Fade>
              <a className={styles.faq_more} href="https://docs.filda.io/faq-guan-yu-filda-ni-xiang-zhi-dao-de" target="_blank">{t('AboutUs.faq.btn')}</a>
            </Fade>
          </div>
        </div>
        </div>
      </section>
    )
  }

  const partner = () => {
    return (
      <section className={classNames(styles.sec, styles.partner)}>
        <div className={styles.inner}>
          <Fade right>
            <div className={styles.content}>
              <h2 className={styles.mainTitle}>{t('AboutUs.partner.title')}</h2>
              <div className={styles.partner_list}>
                {
                  partnerData.map(item => (
                    <div key={item} className={classNames(styles.partner_item, styles[item])}>
                      <img src={require(`../../images/aboutUs/partner_${item}.png`)}/>
                    </div>
                  ))
                }
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }

  const media = () => {
    const iconSize = 40;
    return (
      <section className={classNames(styles.sec, styles.media)}>
        <div className={styles.inner}>
        <Fade right>
          <div className={styles.content}>
            <h2 className={styles.mainTitle}>{t('AboutUs.media.title')}</h2>
            <div className={styles.media_list}>
              <div className={classNames(styles.media_item)}>
                <a target="_blank" href="https://github.com/fildaio/FilDA">
                  <FaGithub size={iconSize} title="Github"/>
                  <span>Github</span>
                </a>
              </div>
              <div className={classNames(styles.media_item)}>
                <a target="_blank" href='Wechat.jpeg'>
                  <FaWeixin size={iconSize}/>
                  <span>Wechat</span>
                </a>
              </div>
              <div className={classNames(styles.media_item)}>
                <a target="_blank" href="https://twitter.com/fildafinance">
                  <FaTwitter size={iconSize}/>
                  <span>Twitter</span>
                </a>
              </div>
              <div className={classNames(styles.media_item)}>
                <a target="_blank" href="https://t.me/FilDAcommunity">
                  <FaTelegramPlane size={iconSize}/>
                  <span>Telegram</span>
                </a>
              </div>
              <div className={classNames(styles.media_item)}>
                <a target="_blank" href="https://www.reddit.com/r/FilDA/">
                  <FaRedditAlien size={iconSize}/>
                  <span>Reddit</span>
                </a>
              </div>
            </div>
          </div>
        </Fade>
        </div>
      </section>
    )
  }

  const person = () => {
    return (
      <section className={classNames(styles.sec, styles.person)}>
        <div className={styles.inner}>
          <Fade bottom>
            <div className={styles.content}>
              <h2 className={classNames(styles.mainTitle, styles.personTitle)}>{t('AboutUs.person.title')}</h2>
              <div className={styles.person_list}>
                {
                  personData(t).map((item, index) => (
                    <div key={index} className={styles.person_item}>
                      <img src={require(`../../images/aboutUs/${item.avater}`)}/>
                      <div className={styles.person_info}>
                        <div className={styles.person_name}>{item.name}</div>
                        <div className={styles.person_country}>{item.country}</div>
                        {
                          item.role.map((i, idx) => (
                            <div key={idx} className={styles.person_role}>{i}</div>
                          ))
                        }
                        
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </Fade>
        </div>
      </section>
    )
  }


  return (
      <div className={styles.aboutUsContainer}>
        {whatIsFilDA()}
        {security()}
        {supportedAssets()}
        {lendBorrow()}
        {staking()}
        {dao()}
        {/* {future()} */}
        {faq()}
        {partner()}
        {roadMap()}
        {media()}
        {/* 管理员志愿者和社区开发者 */}
        {person()}
      </div>
  )
}


export default AboutUs
