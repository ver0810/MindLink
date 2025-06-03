// Mentor data
const mentors = [
    {
        id: 'buffett',
        name: '沃伦·巴菲特',
        title: '伯克希尔·哈撒韦公司董事长兼CEO',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg/440px-Warren_Buffett_at_the_2015_SelectUSA_Investment_Summit_%28cropped%29.jpg',
        shortBio: '价值投资的代表人物，被称为"奥马哈的神谕"，以长期价值投资和简单直接的商业智慧著称。',
        bio: '沃伦·巴菲特是全球最成功的投资者之一，以价值投资策略著称。他相信投资于有持久竞争优势的企业，并长期持有。巴菲特强调商业简单性、财务保守性以及管理诚信度的重要性。他的投资哲学影响了几代投资者，他的年度股东信被视为商业智慧的瑰宝。',
        expertise: ['价值投资', '商业评估', '风险管理', '企业收购', '长期战略'],
        featured: true,
        suggestedQuestions: [
            '如何评估一个初创企业的内在价值？',
            '在不确定的经济环境中，创业者应如何制定财务策略？',
            '您认为创业早期最容易被忽视的风险是什么？',
            '如何构建一个有持久竞争优势的商业模式？'
        ]
    },
    {
        id: 'lika',
        name: '李嘉诚',
        title: '长江和记实业创始人',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Li_Ka-shing_2013.jpg/440px-Li_Ka-shing_2013.jpg',
        shortBio: '亚洲最成功的企业家之一，以多元化投资和商业智慧著称，被称为"超人"。',
        bio: '李嘉诚从一个塑料制造厂起家，逐步建立了横跨地产、零售、能源和电信的商业帝国。他以敏锐的商业嗅觉、果断的决策能力和灵活的商业策略著称。李嘉诚强调勤奋、诚信和不断学习的重要性，同时也以其慈善事业闻名。他的商业智慧融合了东西方思想，为众多创业者提供了宝贵的经验。',
        expertise: ['多元化投资', '企业扩张', '资产管理', '风险控制', '国际化战略'],
        featured: true,
        suggestedQuestions: [
            '初创企业如何有效管理现金流？',
            '在扩展业务时，如何平衡风险和机遇？',
            '您如何看待全球化对中小企业的挑战和机遇？',
            '创业者应该如何培养商业直觉和决策能力？'
        ]
    },
    {
        id: 'ma',
        name: '马云',
        title: '阿里巴巴集团创始人',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Jack_Ma_2015.jpg/440px-Jack_Ma_2015.jpg',
        shortBio: '中国电子商务的先驱，从英语教师到互联网巨头的创始人，以远见卓识和领导力著称。',
        bio: '马云是阿里巴巴集团的创始人，将公司从一个小型创业公司发展为全球电子商务巨头。他以前瞻性的互联网思维、鼓舞人心的领导风格和独特的商业哲学著称。马云强调创新、客户第一和团队协作的企业文化，他的创业故事鼓舞了无数创业者。他特别关注中小企业的发展，以及科技如何改变传统商业模式。',
        expertise: ['电子商务', '互联网创新', '团队建设', '商业模式创新', '企业文化'],
        featured: true,
        suggestedQuestions: [
            '如何在激烈的市场竞争中找到自己的差异化优势？',
            '创业初期，如何打造高效且有凝聚力的团队？',
            '您认为未来十年互联网创业的机会在哪些领域？',
            '如何平衡企业成长和创始人的个人成长？'
        ]
    },
    {
        id: 'altman',
        name: 'Sam Altman',
        title: 'OpenAI CEO',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Sam_Altman_Official_Portrait.jpg/440px-Sam_Altman_Official_Portrait.jpg',
        shortBio: '科技创业投资者，前Y Combinator总裁，OpenAI CEO，以培养科技创业公司和人工智能领域的前瞻性著称。',
        bio: 'Sam Altman是OpenAI的CEO，曾担任著名创业加速器Y Combinator的总裁。他在年轻时创立了社交定位应用Loopt，之后转向投资和培养科技创业公司。Altman以其对创业公司的深刻见解和对人工智能等前沿技术的前瞻性思考著称。他强调产品市场契合度、团队构建和长期思维的重要性，对科技创业生态系统有着重要影响。',
        expertise: ['人工智能', '科技创业', '风险投资', '产品策略', '未来趋势'],
        featured: true,
        suggestedQuestions: [
            '初创企业如何有效利用AI技术提升竞争力？',
            '在技术快速迭代的环境中，如何制定长期产品战略？',
            '创业者应该如何看待失败和学习？',
            '您认为AI将如何改变未来的商业模式和工作方式？'
        ]
    },
    {
        id: 'musk',
        name: 'Elon Musk',
        title: 'Tesla, SpaceX, X (前Twitter)创始人',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/440px-Elon_Musk_Royal_Society_%28crop2%29.jpg',
        shortBio: '连续创业者，以颠覆性创新和跨领域思维著称，致力于解决人类面临的重大挑战。',
        bio: 'Elon Musk是多家创新公司的创始人，包括Tesla、SpaceX、Neuralink和The Boring Company。他以远大的愿景、颠覆性思维和跨领域创新能力著称。Musk将创业视为解决人类面临的重大挑战的途径，如可持续能源、太空探索和人工智能安全。他的领导风格兼具技术深度和商业敏锐度，但也因工作强度高和直言不讳而引起争议。',
        expertise: ['颠覆性创新', '多领域创业', '工程与设计', '长期愿景', '风险管理'],
        featured: false,
        suggestedQuestions: [
            '如何在创业中平衡远大愿景与短期可行性？',
            '创业者应该如何看待失败和承担风险？',
            '在资源有限的情况下，如何推动技术创新？',
            '您认为未来十年最有前景的创业方向是什么？'
        ]
    },
    {
        id: 'zhang',
        name: '张小龙',
        title: '微信创始人，腾讯高级副总裁',
        avatar: 'https://i0.wp.com/www.eastasiaforum.org/wp-content/uploads/2017/02/20160827_0001_news_201608270001_1_L.jpg?fit=700%2C465&ssl=1',
        shortBio: '中国顶级产品经理，微信之父，以极简设计理念和用户体验至上的产品哲学著称。',
        bio: '张小龙是腾讯微信的创始人，将其打造成为中国最具影响力的社交平台。他以"克制"的产品设计理念、对用户体验的极致追求和独特的产品哲学著称。张小龙强调产品应该"让创造发挥价值，而不是产品本身"，并注重细节和简洁设计。他的产品思维对中国互联网产品的发展有着深远影响，被誉为中国顶级产品经理。',
        expertise: ['产品设计', '用户体验', '移动互联网', '社交平台', '产品迭代'],
        featured: false,
        suggestedQuestions: [
            '如何设计一个既简洁又功能强大的产品？',
            '产品迭代中如何平衡用户反馈和自身愿景？',
            '在移动互联网时代，如何捕捉用户需求的本质？',
            '您认为好的产品经理应具备哪些核心能力？'
        ]
    },
    {
        id: 'jobs',
        name: 'Steve Jobs',
        title: 'Apple联合创始人',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/440px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg',
        shortBio: '科技创新领袖，以产品设计美学、革命性创新和完美主义著称，改变了多个行业。',
        bio: 'Steve Jobs是Apple公司的联合创始人，他彻底改变了个人计算机、音乐、手机和平板电脑行业。Jobs以其对设计的痴迷、对细节的关注和对用户体验的极致追求著称。他的领导风格强调创新、简洁和高标准，虽然有时被视为严厉，但也激发了团队创造出革命性产品。Jobs强调科技与人文的交叉点，以及"不同凡想"(Think Different)的理念。',
        expertise: ['产品愿景', '设计思维', '创新文化', '营销策略', '颠覆式创新'],
        featured: false,
        suggestedQuestions: [
            '如何在公司内部培养创新文化？',
            '创业者应如何平衡产品理想与市场现实？',
            '在产品设计中，如何判断哪些功能应该舍弃？',
            '您认为科技创业中，设计思维的重要性体现在哪里？'
        ]
    },
    {
        id: 'sandberg',
        name: 'Sheryl Sandberg',
        title: '前Facebook(Meta)首席运营官',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Sheryl_Sandberg_-_2018_%2842964536051%29_%28cropped%29.jpg/440px-Sheryl_Sandberg_-_2018_%2842964536051%29_%28cropped%29.jpg',
        shortBio: '硅谷顶级管理者，著名女性领导力代表，以精湛的业务运营能力和组织管理才能著称。',
        bio: 'Sheryl Sandberg曾担任Facebook(Meta)的首席运营官，帮助公司建立了成功的商业模式和运营体系。此前，她在Google负责全球在线销售和运营。Sandberg以其卓越的领导能力、业务洞察力和组织管理才能著称。她的著作《向前一步》(Lean In)探讨了职场女性面临的挑战和机遇，倡导女性追求职业抱负并发挥领导力。',
        expertise: ['组织管理', '业务扩展', '企业运营', '领导力发展', '女性创业'],
        featured: false,
        suggestedQuestions: [
            '创业公司如何建立高效的组织结构和运营体系？',
            '如何在快速增长的创业公司中培养领导者？',
            '女性创业者面临的独特挑战有哪些，如何应对？',
            '从0到1与从1到100，运营重点有什么不同？'
        ]
    }
];

