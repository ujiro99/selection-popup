export const Commands = [
  {
    id: 'f5492254-4d6c-5924-860f-c8b668a76d7a',
    title: 'Yahoo!検索',
    description: 'Yahoo!検索で選択キーワードを検索します',
    searchUrl: 'https://search.yahoo.co.jp/search?p=%s',
    iconUrl: 'https://www.yahoo.co.jp/favicon.ico',
    openMode: 'popup',
    openModeSecondary: 'tab',
    spaceEncoding: 'plus',
    tags: ['Search'],
  },
  {
    id: 'd458538c-efd1-5e0f-99b0-80db8167d2db',
    title: '英語 → 日本語',
    description: 'DeepLで英語を日本語に翻訳します',
    searchUrl: 'https://www.deepl.com/ja/translator#en/ja/%s',
    iconUrl: 'https://static.deepl.com/img/favicon/favicon_96.png',
    openMode: 'popup',
    openModeSecondary: 'tab',
    spaceEncoding: 'percent',
    tags: ['Language', 'Translation', '翻訳', 'Tool', 'Japanese'],
  },
  {
    id: '17026810-b9ed-5f5a-8e02-569b4cef1dcb',
    title: '日本語 → 英語',
    description: 'DeepLで英語を日本語に翻訳します',
    searchUrl: 'https://www.deepl.com/ja/translator#ja/en/%s',
    iconUrl: 'https://static.deepl.com/img/favicon/favicon_96.png',
    openMode: 'popup',
    openModeSecondary: 'tab',
    spaceEncoding: 'percent',
    tags: ['Language', 'Translation', 'Tool', 'Japanese'],
  },
]
