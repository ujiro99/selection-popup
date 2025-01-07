import { SORT_ORDER, OPEN_MODE } from '@/const'

export default {
  errorPage: {
    error: '送信エラーが発生しました。',
    afterShortTime: '暫く経ってからお問い合わせください。',
  },
  commandShare: {
    title: 'コマンド共有',
    formTitle: 'コマンド共有フォーム',
  },
  inputForm: {
    title: {
      label: 'タイトル',
      description: 'コマンドのタイトルとして表示されます。',
      message: {
        min3: 'タイトルは最短3文字です。',
        max100: 'タイトルは最長100文字です。',
      },
    },
    searchUrl: {
      label: '検索URL',
      description: '`%s`を選択テキストに置換します。',
      message: {
        url: 'URL形式が正しくありません。',
        unique: '既に登録されています。',
      },
    },
    description: {
      label: 'コマンドの説明',
      description: 'コマンドの説明として表示されます。',
      message: {
        max200: '説明は最長200文字です。',
      },
    },
    tags: {
      label: 'タグ',
      description: 'コマンドの分類として表示されます。',
      message: {
        max5: 'タグは最長20文字です。',
        max20: 'タグは最大5つまでです。',
      },
    },
    iconUrl: {
      label: 'アイコンURL',
      description: 'メニューのアイコンとして表示されます。',
    },
    openMode: {
      label: 'OpenMode',
      description: '結果の表示方法です。',
      options: {
        [OPEN_MODE.POPUP]: 'Popup',
        [OPEN_MODE.WINDOW]: 'Window',
        [OPEN_MODE.TAB]: 'Tab',
      },
    },
    openModeSecondary: {
      label: 'Ctrl + クリック',
      description: 'Ctrl + クリック時の結果の表示方法です。',
    },
    spaceEncoding: {
      label: 'スペースのエンコード',
      description: '選択テキスト中のスペースを置換します。',
      options: {
        plus: 'Plus(+)',
        percent: 'Percent(%20)',
      },
    },
    inputFormDescription: 'コマンドの共有を申請します。',
    inputFormOptions: 'オプション',
    inputFormConfirm: '入力内容を確認する',
  },
  confirmForm: {
    formDescription: '以下の内容で間違いありませんか？',
    caution: '※送信された情報は本サイト上で公開されます。\n個人情報や機密情報を含む情報の共有はお控えください。',
    back: '修正する',
    submit: '共有実行',
  },
  sortOrder: {
    [SORT_ORDER.searchUrl]: '検索URL',
    [SORT_ORDER.title]: 'タイトル',
    [SORT_ORDER.download]: 'ダウンロード数',
    [SORT_ORDER.star]: 'スター数',
    [SORT_ORDER.addedAt]: '登録日',
    new: '新',
    old: '古',
  },
}
