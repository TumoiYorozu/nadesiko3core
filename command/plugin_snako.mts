/**
 * file: plugin_snako.js
 * 簡単なファイル読み書きのプラグイン
 */
import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'

export default {
  '初期化': {
    type: 'func',
    josi: [],
    pure: true,
    fn: function (sys: any) {
      sys.__getBokanPath = () => {
        let nakofile
        const cmd = path.basename(process.argv[1])
        if (cmd.indexOf('snako') < 0) { nakofile = process.argv[1] } else { nakofile = process.argv[2] }
        return path.dirname(path.resolve(nakofile))
      }
      sys.__v0['コマンドライン'] = process.argv
      sys.__v0['ナデシコランタイムパス'] = process.argv[0]
      sys.__v0['ナデシコランタイム'] = path.basename(process.argv[0])
      sys.__v0['母艦パス'] = sys.__getBokanPath()
    }
  },
  // @SNAKO
  'コマンドライン': { type: 'const', value: '' },
  'ナデシコランタイムパス': { type: 'const', value: '' },
  'ナデシコランタイム': { type: 'const', value: '' },
  '母艦パス': { type: 'const', value: '' },
  '読': { // @ ファイルFの内容を読む // @よむ
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (f: string): string {
      return '' + fs.readFileSync(f)
    }
  },
  '開': { // @ ファイルFの内容を読む // @ひらく
    type: 'func',
    josi: [['を', 'から']],
    pure: true,
    fn: function (f: string): string {
      return '' + fs.readFileSync(f)
    }
  },
  '保存': { // @ 文字列SをファイルFに保存 // @ほぞん
    type: 'func',
    josi: [['を'], ['に', 'へ']],
    pure: true,
    fn: function (s: string, f: string): void {
      fs.writeFileSync(f, s, 'utf-8')
    },
    return_none: true
  },
  '起動待機': { // @シェルコマンドSを起動し実行終了まで待機する // @きどうたいき
    type: 'func',
    josi: [['を']],
    pure: true,
    fn: function (s: string) {
      const r = execSync(s)
      return r.toString()
    }
  },
  'ファイル名抽出': { // @フルパスのファイル名Sからファイル名部分を抽出して返す // @ふぁいるめいちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.basename(s)
    }
  },
  'パス抽出': { // @ファイル名Sからパス部分を抽出して返す // @ぱすちゅうしゅつ
    type: 'func',
    josi: [['から', 'の']],
    pure: true,
    fn: function (s: string) {
      return path.dirname(s)
    }
  },
  '絶対パス変換': { // @相対パスから絶対パスに変換して返す // @ぜったいぱすへんかん
    type: 'func',
    josi: [['を', 'の']],
    pure: true,
    fn: function (a: string) {
      return path.resolve(a)
    }
  },
  '相対パス展開': { // @ファイル名AからパスBを展開して返す // @そうたいぱすてんかい
    type: 'func',
    josi: [['を'], ['で']],
    pure: true,
    fn: function (a: string, b: string) {
      return path.resolve(path.join(a, b))
    }
  }
}
