/** インデント構文を処理するモジュール */

import { Token, NewEmptyToken } from './nako_types.mjs'
import { NakoIndentError } from '../src/nako_errors.mjs'

function isSkipWord (t: Token): boolean {
  if (t.type === '違えば') { return true }
  if (t.type === 'word' && t.value === 'エラー' && t.josi === 'ならば') { return true }
  return false
}

/** インラインインデント構文 --- 末尾の":"をインデントを考慮して"ここまで"を挿入 (#1215) */
export function convertInlineIndent (tokens: Token[]): Token[] {
  const lines: Token[][] = splitTokens(tokens, 'eol')
  const blockIndents: number[] = []
  let checkICount = -1
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.length === 0) { continue }
    // インデントの終了を確認する必要があるか？
    if (checkICount >= 0) {
      const lineICount: number = lines[i][0].indent
      while (checkICount >= lineICount) {
        const tFirst: Token = line[0]
        if (isSkipWord(tFirst)) { // 「違えば」の直前には「ここまで」不要
          // 挿入不要
        } else {
          // ここまでを挿入する
          lines[i - 1].push(NewEmptyToken('ここまで', '', lineICount, tFirst.line))
        }
        blockIndents.pop()
        if (blockIndents.length > 0) {
          checkICount = blockIndents[blockIndents.length - 1]
        } else {
          checkICount = -1
          break
        }
      }
    }
    const tLast: Token = getLastTokenWithoutEOL(line)
    if (tLast.type === ':') {
      // 末尾の「:」を削除
      lines[i] = lines[i].filter(t => t !== tLast)
      checkICount = tLast.indent
      blockIndents.push(checkICount)
    }
  }
  if (lines.length > 0) {
    for (let i = 0; i < blockIndents.length; i++) {
      lines[lines.length - 1].push(NewEmptyToken('ここまで'))
    }
  }
  return joinTokenLines(lines)
}

/** 行ごとに分割していたトークンをくっつける */
export function joinTokenLines (lines: Token[][]): Token[] {
  const r: Token[] = []
  for (const line of lines) {
    for (const t of line) {
      r.push(t)
    }
    // debug
    // console.log('@@join=', mkIndent(line[0] ? line[0].indent : 0), line.map(t => (t.type + '_' + t.value + ':' + t.indent)).join(' | '))
  }
  // console.log('@@@-----')
  return r
}

function mkIndent (num: number): string {
  let s = ''
  for (let i = 0; i < num; i++) {
    s += ' '
  }
  return s
}

function getLastTokenWithoutEOL (line: Token[]): Token {
  const len: number = line.length
  if (len === 0) { return NewEmptyToken('?') }
  let res: Token = line[len - 1]
  if (res.type === 'eol') {
    if (len >= 2) { res = line[len - 2] }
  }
  return res
}

export function splitTokens (tokens: Token[], delimiter: string): Token[][] {
  const result: Token[][] = []
  let line: Token[] = []
  let kakko = 0
  for (const t of tokens) {
    line.push(t)
    if (t.type === '{') {
      kakko++
    } else if (t.type === '}') {
      kakko--
    } else if (kakko === 0 && t.type === delimiter) {
      result.push(line)
      line = []
    }
  }
  if (line.length > 0) {
    result.push(line)
  }
  return result
}

// インデント構文のキーワード
const INDENT_MODE_KEYWORDS = ['!インデント構文', '!ここまでだるい', '💡インデント構文', '💡ここまでだるい']

/** インデント構文 --- インデントを見て"ここまで"を自動挿入 (#596) */
export function convertIndentSyntax (tokens: Token[]): Token[] {
  // インデント構文の変換が必要か?
  if (!useIndentSynax(tokens)) { return tokens }
  // 『ここまで』があったらエラーを出す
  for (const t of tokens) {
    if (t.type === 'ここまで') {
      // エラーを出す
      throw new NakoIndentError('インデント構文が有効化されているときに『ここまで』を使うことはできません。', t.line, t.file)
    }
  }
  const blockIndents: number[] = []
  const lines = splitTokens(tokens, 'eol')
  let lastI = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.length === 0) { continue } // 空行は飛ばす
    if (line[0].type === 'eol') { continue } // 空行は飛ばす
    const curI: number = line[0].indent
    if (curI === lastI) { continue }
    // ブロックの終了?
    // 0: 3回
    // 2:   もし、1 > 1ならば
    // 4:     1を表示
    // 2:   違えば
    // 4:     2を表示
    // 0:
    // ブロックの終了?
    if (lastI >= 0) {
      while (lastI > curI) {
        if (isSkipWord(line[0])) {
          // 「違えば」などなら不要
        } else {
          lines[i - 1].push(NewEmptyToken('ここまで'))
        }
        // console.log('@@@pop', lastI, '>=', curI, ':', line[0])
        blockIndents.pop()
        if (blockIndents.length > 0) {
          lastI = blockIndents[blockIndents.length - 1]
        } else {
          lastI = 0
          break
        }
      }
    }
    // ブロックの開始？
    if (curI > lastI) {
      blockIndents.push(curI)
      // console.log('@@@push', curI)
      lastI = curI
      continue
    }
  }
  for (let i = 0; i < blockIndents.length; i++) {
    lines[lines.length - 1].push(NewEmptyToken('ここまで'))
  }
  // 再構築
  return joinTokenLines(lines)
}

function useIndentSynax (tokens: Token[]) : boolean {
  // インデント構文が必要かチェック (最初の100個をチェック)
  for (let i = 0; i < tokens.length; i++) {
    if (i > 100) { break }
    const t = tokens[i]
    if (t.type === 'line_comment' && (INDENT_MODE_KEYWORDS.indexOf(t.value) >= 0)) {
      return true
    }
  }
  return false
}
