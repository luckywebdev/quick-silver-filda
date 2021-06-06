
export const faqData = (t) => {
  const data = [{
    index:1,
    top: true,
    Q: t('AboutUs.faq.maximumFilDA_hd'),
    A: `
        <p>${t('AboutUs.faq.maximumFilDA_bd1')}</p>
        <p>${t('AboutUs.faq.maximumFilDA_bd2')}</p>
        <p>${t('AboutUs.faq.maximumFilDA_bd3')}</p>
        <p>${t('AboutUs.faq.maximumFilDA_bd4')}</p>
        <p>${t('AboutUs.faq.maximumFilDA_bd5')}</p>
        <p>${t('AboutUs.faq.maximumFilDA_bd6')}</p>
    `
  }, {
    index:2,
    top: true,
    Q: t('AboutUs.faq.miningRewards_hd'),
    A: `<p>${t('AboutUs.faq.miningRewards_bd1')}</p>`
  }, {
    Q: t('AboutUs.faq.earlyPaidLoan_hd'),
    A: `<p>${t('AboutUs.faq.earlyPaidLoan_bd1')}</p>`
  }, {
    index:4,
    top: true,
    Q: t('AboutUs.faq.APRandAPY.hd'),
    A: `
        <p>${t('AboutUs.faq.APRandAPY.bd1')}</p>
        <p>${t('AboutUs.faq.APRandAPY.bd2')}</p>
    `
  }, {
    index:5,
    top: true,
    Q: t('AboutUs.faq.repaymentLoansDate.hd'),
    A: `<p>${t('AboutUs.faq.repaymentLoansDate.bd1')}</p>`
  }, {
    Q: t('AboutUs.faq.borrowerNotRepayLoan.hd'),
    A: `<p>${t('AboutUs.faq.borrowerNotRepayLoan.bd1')}</p>`
  }, {
    Q: t('AboutUs.faq.liquidationWork.hd'),
    A: `<p>${t('AboutUs.faq.liquidationWork.bd1')}</p>`
  }, {
    Q: t('AboutUs.faq.assetsSafe.hd'),
    A: `<p>${t('AboutUs.faq.assetsSafe.bd1')}</p>
        <p>${t('AboutUs.faq.assetsSafe.bd2')}</p>
    `
  }, {
    Q: t('AboutUs.faq.assetsDifferentRates.hd'),
    A: `<p>${t('AboutUs.faq.assetsDifferentRates.bd1')}</p>`
  },{
    index:3,
    top: true,
    Q: t('AboutUs.faq.howToStake.hd'),
    A: `<p>${t('AboutUs.faq.howToStake.list.hd')}</p>
      <ul>
        <li>${t('AboutUs.faq.howToStake.item1')}</li>
        <li>${t('AboutUs.faq.howToStake.item2')}</li>
        <li>${t('AboutUs.faq.howToStake.item3')}</li>
        <li>${t('AboutUs.faq.howToStake.item4')}</li>
        <li>${t('AboutUs.faq.howToStake.item5')}</li>
        <li>
          <p>${t('AboutUs.faq.howToStake.item6.1')}</p>
          <p>${t('AboutUs.faq.howToStake.item6.2')}</p>
        </li>
        <li>
          <p>${t('AboutUs.faq.howToStake.item7.1')}</p>
          <p>${t('AboutUs.faq.howToStake.item7.2')}</p>
          <p>${t('AboutUs.faq.howToStake.item7.3')}</p>
        </li>
      </ul>
      <strong>${t('AboutUs.faq.howToStake.note')}</strong>
    `
  }].filter(item => {
    item.isShowA = false;
    return item.top
  }).sort((a,b) => a.index - b.index)
  return data
}


export const roadmapData = (t) => {
  return [{
    date: '2021-01-05',
    content: `<p>${t('AboutUs.roadmap.0105.Specifics')}</p>`
  }, {
    date: '2021-01-12',
    name: t('AboutUs.roadmap.0112.name'),
    type: t('AboutUs.roadmap.0112.type'),
    content: `<p>${t('AboutUs.roadmap.0112.Specifics')}</p>`
  }, {
    date: '2021-01-14',
    name: t('AboutUs.roadmap.0114.name'),
    type: t('AboutUs.roadmap.0114.type'),
    content: `<p>${t('AboutUs.roadmap.0114.Specifics')}</p>`
  }, {
    date: '2021-01-19',
    name: t('AboutUs.roadmap.0119.name'),
    type: t('AboutUs.roadmap.exchange'),
    content: `<p>${t('AboutUs.roadmap.0119.Specifics')}</p>`
  }, {
    date: '2021-01-28',
    name: t('AboutUs.roadmap.0128_1.name'),
    type: t('AboutUs.roadmap.exchange'),
    content: `<p>${t('AboutUs.roadmap.0128_1.Specifics')}</p>`
  }, {
    date: '2021-01-28',
    content: `<p>${t('AboutUs.roadmap.0128_2.Specifics')}</p>`
  },{
    date: '2021-02-03',
    name: t('AboutUs.roadmap.0203.name'),
    type: t('AboutUs.roadmap.0203.type'),
    content: `<p>${t('AboutUs.roadmap.0203.Specifics')}</p>`
  }, {
    date: '2021-02-06',
    name: t('AboutUs.roadmap.0206.name'),
    type: t('AboutUs.roadmap.0206.type'),
    content: `<ol>
                <li>${t('AboutUs.roadmap.0206.Specifics_1')}</li>
                <li>${t('AboutUs.roadmap.0206.Specifics_2')}</li>
                <li>${t('AboutUs.roadmap.0206.Specifics_3')}</li>
              </ol>`
  }, {
    date: '2021-02-08',
    name: t('AboutUs.roadmap.0208_1.name'),
    type: t('AboutUs.roadmap.exchange'),
    content: `<p>${t('AboutUs.roadmap.0208_1.Specifics')}</p>`
  }, {
    date: '2021-02-08',
    name: t('AboutUs.roadmap.0208_2.name'),
    type: t('AboutUs.roadmap.0208_2.type'),
    content: `<p>${t('AboutUs.roadmap.0208_2.Specifics')}</p>`
  }, {
    date: '2021-02-13',
    name: t('AboutUs.roadmap.0213.name'),
    type: t('AboutUs.roadmap.0213.type'),
    content: `<p>${t('AboutUs.roadmap.0213.Specifics')}</p>`
  }, {
    date: '2021-02-14',
    name: t('AboutUs.roadmap.0214.name'),
    type: t('AboutUs.roadmap.0214.type'),
    content: `
              <ol>
                <li>${t('AboutUs.roadmap.0214.Specifics_1')}</li>
                <li>${t('AboutUs.roadmap.0214.Specifics_2')}</li>
              </ol>`
  }, {
    date: '2021-02-15',
    name: t('AboutUs.roadmap.0215.name'),
    type: t('AboutUs.roadmap.0215.type'),
    content: `<ul>
                <li>${t('AboutUs.roadmap.0215.Specifics_1')}</li>
                <li>${t('AboutUs.roadmap.0215.Specifics_2')}</li>
                <li>${t('AboutUs.roadmap.0215.Specifics_3')}</li>
              </ul>`
  }, {
    date: '2021-02-25',
    name: t('AboutUs.roadmap.0225.name'),
    type: t('AboutUs.roadmap.0225.type'),
    content: `<p>${t('AboutUs.roadmap.0225.Specifics')}</p>`
  }, {
    date: '2021-03-12',
    name: t('AboutUs.roadmap.0312.name'),
    type: t('AboutUs.roadmap.0312.type'),
    content: `<p>${t('AboutUs.roadmap.0312.Specifics')}</p>`
  }, {
    date: '2021-03-23',
    name: t('AboutUs.roadmap.0323.name'),
    type: t('AboutUs.roadmap.0323.type'),
    content: `<p>${t('AboutUs.roadmap.0323.Specifics')}</p>`
  }, {
    date: '2021-03-26',
    name: t('AboutUs.roadmap.0326.name'),
    type: t('AboutUs.roadmap.0326.type')
  },{
    date: '2021-03-31',
    name: t('AboutUs.roadmap.0331.name'),
    type: t('AboutUs.roadmap.0331.type'),
    content: `<p>${t('AboutUs.roadmap.0331.Specifics')}</p>`
  },{
    date: '2021-04-06',
    name: t('AboutUs.roadmap.0406_1.name'),
    type: t('AboutUs.roadmap.exchange'),
    content: `<p>${t('AboutUs.roadmap.0406_1.Specifics')}</p>`
  },{
    date: '2021-04-06',
    name: t('AboutUs.roadmap.0406_2.name'),
    type: t('AboutUs.roadmap.exchange'),
    content: `<p>${t('AboutUs.roadmap.0406_2.Specifics')}</p>`
  },{
    date: '2021-04-11',
    name: t('AboutUs.roadmap.0411.name'),
    type: t('AboutUs.roadmap.0411.type'),
    content: `<p>${t('AboutUs.roadmap.0411.Specifics')}</p>`
  },{
    isFuture: true,
    date: t('AboutUs.roadmap.future_1'),
  }, {
    isFuture: true,
    date: t('AboutUs.roadmap.future_2'),
  }, 
  {
    isFuture: true,
    date: t('AboutUs.roadmap.future_4')
  }, {
    isFuture: true,
    date: t('AboutUs.roadmap.future_5')
  }, {
    isFuture: true,
    date: t('AboutUs.roadmap.future_6')
  }]
}


export const partnerData = [
  'huobiGlobal',
  'mdex',
  'huobiWallet',
  'bitkeep',
  'tokenPocket',
  'codeBank',
  'bingoo',
  'hyperpay',
  'imToken',
  'shadowTokens',
  'huobiPool',
  'earnDefi',
  'biki',
  'ins3',
  'mxc',
  'polyNetwork',
  'starlink',
  'lavaswap',
  'hfiOne',
  'superNavaCash',
  'depth',
  'chainlink',
  'fixedRateProtocol',
  'elastos',
  'neo',
  'sovi'
]


export const personData = (t) => {
  const data =  [
    {
      name: 'Greg',
      avater: 'person_greg.png',
      country: t('AboutUs.person.country.UnitedKingdom'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'MButcho',
      avater: 'person_MButcho.png',
      country: t('AboutUs.person.country.Slovakia'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'KK | CR',
      avater: 'person_KK|CR.png',
      country: t('AboutUs.person.country.Malaysia'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Godzilla.ELA',
      avater: 'person_godzilaELA.png',
      country: t('AboutUs.person.country.Germany'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Austrader',
      avater: 'person_austrader.png',
      country: t('AboutUs.person.country.Australia'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Chris P',
      avater: 'person_chrisP.png',
      country: t('AboutUs.person.country.UnitedKingdom'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'COCO',
      avater: 'person_coco.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'AUSTIN',
      avater: 'person_austin.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Fayi Li',
      avater: 'person_fayiLi.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'PEG2042',
      avater: 'person_PEG2042.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Ryan | Starfish Labs',
      avater: 'person_Ryan.png',
      country: t('AboutUs.person.country.UnitedStates'),
      role: [t('AboutUs.person.role.Developer')]
    },
    {
      name: 'Cassie',
      avater: 'person_Cassie.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin')]
    },
    {
      name: 'Song sjun',
      avater: 'person_songSjun.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin'), t('AboutUs.person.role.Developer')]
    },
    {
      name: 'Ashton Chen',
      avater: 'person_ashtonChen.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin'), t('AboutUs.person.role.Developer')]
    },
    {
      name: 'Aria',
      avater: 'person_Aria.png',
      country: t('AboutUs.person.country.China'),
      role: [t('AboutUs.person.role.Admin'), t('AboutUs.person.role.Developer')]
    },
    {
      name: 'witji',
      avater: 'person_witji.png',
      country: t('AboutUs.person.country.Canada'),
      role: [t('AboutUs.person.role.Developer')]
    },
    {
      name: 'oxatm',
      avater: 'person_oxatm.png',
      country: t('AboutUs.person.country.NewZealand'),
      role: [t('AboutUs.person.role.Developer')]
    },
    {
      name: 'The Drifter',
      avater: 'person_theDrifter.png',
      country: t('AboutUs.person.country.UnitedStates'),
      role: [t('AboutUs.person.role.Developer'), t('AboutUs.person.role.Designer')]
    },
    {
      name: 'Stefano Ferraro',
      avater: 'person_StefanoFerraro.png',
      country: t('AboutUs.person.country.Italy'),
      role: [t('AboutUs.person.role.Designer')]
    }
  ]

  data.sort((a,b) => {
    const nameA = a.name.toUpperCase()
    const nameB = b.name.toUpperCase()
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  })
  
  return data
}


