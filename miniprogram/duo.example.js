const DUO_CONFIG = {
    cloud: {
        env: 'your-cloud-env-id',
        traceUser: true
    },
    cloudStorage: {
        baseUrl: 'your-cloud-storage-base-url',
        paths: {
            fuka: {
                base: '/duo/fuka',
                fukaindex: '/duo/fuka/fukaindex',
                share: '/duo/fuka/share'
            },
            sudoku: {
                base: '/duo/sudoku',
                icons: {
                    categories: '/duo/sudoku/icons/categories'
                }
            },
            duo: {
                base: '/duo/duo'
            }
        }
    },
    // 广告配置
    ads: {
        fuka: {
            generateAdId: 'your-fuka-generate-ad-id'
        },
        game: {
            bannerAdId: 'your-game-banner-ad-id'
        }
    }
}

module.exports = DUO_CONFIG