/* eslint-disable no-undef */
import assert from 'assert'
import { NakoCompiler } from '../src/nako3.mjs'
import { expect } from 'chai'

describe('basic', async () => {
  // nako.logger.addListener('trace', ({ browserConsole }) => { console.log(...browserConsole) })
  const cmp = async (/** @type {string} */code, /** @type {string} */res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    assert.strictEqual((await nako.runAsync(code)).log, res)
  }
  const cmpNakoFuncs = (/** @type {string} */code, /** @type {Set<string>} */res) => {
    const nako = new NakoCompiler()
    nako.logger.debug('code=' + code)
    nako.parse(code, 'main.nako3')
    assert.deepStrictEqual(nako.usedFuncs, res)
  }
  // --- test ---
  it('print simple', async () => {
    await cmp('3を表示', '3')
  })
  it('print', async () => {
    await cmp('3を表示', '3')
    await cmp('100を表示', '100')
    await cmp('0xFFを表示', '255')
  })
  it('string', async () => {
    await cmp('「abc」を表示', 'abc')
    await cmp('"abc"を表示', 'abc')
    await cmp('“あいう”を表示', 'あいう')
  })
  it('rawstring', async () => {
    await cmp('『abc』を表示', 'abc')
    await cmp('\'abc\'を表示', 'abc')
    await cmp('『abc{30}abc』を表示', 'abc{30}abc')
  })
  it('exstring', async () => {
    await cmp('a=30;「abc{a}abc」を表示', 'abc30abc')
    await cmp('a=30;「abc｛a｝abc」を表示', 'abc30abc')
  })
  it('raw string - 🌿 .. 🌿', async () => {
    await cmp('a=🌿abc🌿;aを表示', 'abc')
  })
  it('EX string - 🌴 .. 🌴', async () => {
    await cmp('v=30;a=🌴abc{v}abc🌴;aを表示', 'abc30abc')
  })
  it('string - LF', async () => {
    await cmp('a=30;「abc\nabc」を表示', 'abc\nabc')
  })
  it('space 「・」', async () => {
    await cmp('・a=30;・b=50「{a}-{b}」を表示', '30-50')
  })
  it('string - 🌴 ... 🌴', async () => {
    await cmp('🌴aaa🌴を表示', 'aaa')
    await cmp('a=30;🌴aaa{a}bbb🌴を表示', 'aaa30bbb')
    await cmp('a=30;🌿aaa{a}bbb🌿を表示', 'aaa{a}bbb')
  })
  it('システム定数', async () => {
    await cmp('ナデシコエンジンを表示', 'nadesi.com/v3')
  })
  it('助詞の後に句読点', async () => {
    await cmp('「こんにちは」と、表示。', 'こんにちは')
  })
  it('代入文', async () => {
    await cmp('3000を値段に代入。値段を表示', '3000')
    await cmp('値段に3000を代入。値段を表示', '3000')
    await cmp('々=3000。々を表示', '3000')
    await cmp('々に3000を代入。々を表示', '3000')
  })
  it('連文後の代入文', async () => {
    await cmp('「aabbcc」の「aa」を「」に置換してFに代入。Fを表示', 'bbcc')
    await cmp('「aabbcc」の「aa」を「」に置換して「bb」を「」に置換してFに代入。Fを表示', 'cc')
  })
  it('〜を〜に定める', async () => {
    await cmp('Aを0.8に定めてAを表示', '0.8')
  })
  it('文字列 - &と改行', async () => {
    await cmp('「aaa」& _\n「bbb」を表示。', 'aaabbb')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _\n1 + 1\nAを表示', '7')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _\r\n1 + 1 + 1\r\nAを表示', '8')
    await cmp('A= 1 + 1 + 1 + 1 + 1 + _  \r\n1 + 3  \r\nAを表示', '9')
    await cmp('A = 1 + _\n' +
      '    5 + _\n' +
      '    10\n' +
      'Aを表示。', '16')
  })
  it('名前に数字を持つ変数を使う', async () => {
    await cmp('A1=30;B1=20;「{A1}{B1}」を表示。', '3020')
  })
  it('名前に絵文字を持つ変数を使う', async () => {
    await cmp('\u1F60=30;\u1F60を表示。', '30')
    await cmp('😄=30;😄を表示。', '30')
  })
  it('ラインコメントが正しく処理されない問題 (#112)', async () => {
    await cmp('A=50 # hogehoge\nAを表示', '50')
    await cmp('A=50 ＃ hogehoge\nAを表示', '50')
    await cmp('A=50 ※ hogehoge\nAを表示', '50')
    await cmp('A=50 // hogehoge\nAを表示', '50')
    await cmp('A=50 ／／ hogehoge\nAを表示', '50')
    await cmp('A=50\nもしA=50ならば # hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ＃ hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ※ hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば // hogehoge\nAを表示\nここまで\n', '50')
    await cmp('A=50\nもしA=50ならば ／／ hogehoge\nAを表示\nここまで\n', '50')
  })
  it('ラインコメントに文字列記号があり閉じていないとエラーになる(#725)', async () => {
    await cmp('A=50 # "hogehoge\nAを表示', '50')
  })
  it('範囲コメントに文字列記号があり閉じていないとエラーになる(#731)', async () => {
    await cmp('A=50 /* " */Aを表示', '50')
    await cmp('A=50 /* \' */Aを表示', '50')
  })
  // #1229
  it('usedFuncs', async () => {
    cmpNakoFuncs('3を表示', new Set(['表示']))
    cmpNakoFuncs('●({関数}fでaを)演算処理とは;それは、f(a);ここまで;●(aを)二倍処理とは;それはa*2;ここまで;二倍処理で2を演算処理して表示',
      new Set(['表示']))
  })
  it('論文などで使われる句読点「，」を「、」(#735)', async () => {
    await cmp('A1=30;B1=20;(A1+B1)を，表示', '50')
    await cmp('A=３．１４;Aを，表示', '3.14')
  })
  it('条件分岐のインデント構文', async () => {
    await cmp(
      '！インデント構文\n' +
      '3で条件分岐\n' +
      '    2ならば\n' +
      '        2を表示\n' +
      '    3ならば\n' +
      '        3を表示\n' +
      '    違えば\n' +
      '        4を表示\n', '3')
  })
  it('💡のインデント構文 #1184', async () => {
    await cmp(
      '💡インデント構文\n' +
      '3で条件分岐\n' +
      '    2ならば\n' +
      '        2を表示\n' +
      '    3ならば\n' +
      '        3を表示\n' +
      '    違えば\n' +
      '        5を表示\n',
      '3'
    )
  })
  it('独立した助詞『ならば』の位置の取得', async () => {
    const nako = new NakoCompiler()
    const out = nako.lex('もし存在するならば\nここまで', '')
    const sonzai = out.tokens.find((t) => t.value === '存在')
    const naraba = out.tokens.find((t) => t.type === 'ならば')

    // 「存在する」
    expect(sonzai).to.have.property('startOffset').and.to.equal(2)
    expect(sonzai).to.have.property('endOffset').and.to.equal(6)

    // ならば
    expect(naraba).to.have.property('startOffset').and.to.equal(6)
    expect(naraba).to.have.property('endOffset').and.to.equal(9)
  })
  it('preCodeを考慮したソースマップ', async () => {
    const nako = new NakoCompiler()
    const preCode = '1を表示\n2を表示\n3を'
    const tokens = nako.lex(preCode + '表示', 'main.nako3', preCode).tokens

    // '3' は-2から0文字目
    const three = tokens.findIndex((t) => t.value === 3)
    assert.strictEqual(tokens[three].startOffset, -2)
    assert.strictEqual(tokens[three].endOffset, 0)
    assert.strictEqual(tokens[three].line, 0)
    assert.strictEqual(tokens[three].column, -2)

    // '表示' は0~1文字目
    assert.strictEqual(tokens[three + 1].startOffset, 0)
    assert.strictEqual(tokens[three + 1].endOffset, 2)
    assert.strictEqual(tokens[three + 1].line, 0)
    assert.strictEqual(tokens[three + 1].column, 0)
  })
  it('実行速度優先 - 1行のみ', async () => {
    const nako = new NakoCompiler()
    nako.reset()
    await cmp(`
「全て」で実行速度優先して1を表示
「全て」で実行速度優先して2を表示
`, '1\n2')
  })
  it('実行速度優先 - ブロック内に適用', async () => {
    // エラーが起きなければ、「実行速度優先」が無い場合と同じ動作をする。
    await cmp(`\
「全て」で実行速度優先
    ●Fとは
        2を表示
        3を表示
    ここまで
    1を表示
    F
ここまで
4を表示
`, '1\n2\n3\n4')
  })
  it('実行速度優先 - 関数宣言の上方下方参照', async () => {
    // エラーが起きなければ、「実行速度優先」が無い場合と同じ動作をする。
    await cmp(`\
「全て」で実行速度優先
    ●Gとは
        2を表示
        3を表示
    ここまで
    ●Fとは
        Eする
    ここまで
    ●Eとは
        Gする
    ここまで
    1を表示
    F
ここまで
4を表示
`, '1\n2\n3\n4')
  })
  it('空白で区切って文をつなげた場合', async () => {
    await cmp('1と2を足す 1と2を足す', '')
  })
  it('return_none: true のaddFuncで定義した関数が「それ」に値を代入しないことを確認する', async () => {
    const nako = new NakoCompiler()
    nako.addFunc('hoge', [], () => { return 0 }, true)
    const g = await nako.run('1と2を足す\nhoge\nそれを表示')
    assert.strictEqual(g.log, '3')
  })
  it('制御構文で一語関数を使う', async () => {
    await cmp('●一とは\n1を戻す\nここまで\nもし一ならば\n1を表示\nここまで', '1') // if
    await cmp('●一とは\n1を戻す\nここまで\n一回\n1を表示\nここまで', '1') // times
    await cmp('●一とは\n1を戻す\nここまで\n一の間\n1を表示\n抜ける\nここまで', '1') // while
    await cmp('●一とは\n[1]を戻す\nここまで\n一を反復\n1を表示\nここまで', '1') // foreach
    await cmp('●一とは\n1を戻す\nここまで\n一で条件分岐\n1ならば\n1を表示\nここまで\nここまで', '1') // switch
  })
  it('そう', async () => {
    // 「そう」は「それ」のエイリアス
    await cmp('それ＝1;そうを表示', '1')
    await cmp('1に3を足す;そうを表示', '4')
  })
  it('「〜時間」の「間」を制御構文として認識させない #831', async () => {
    await cmp('時間=1\n（時間）を表示', '1')
  })
  it('「もしFが存在するならば」がFと「存在する」の比較になる問題の修正 #830', async () => {
    await cmp(
      '●（Aが）hogeとは\n' +
      '    1を戻す\n' +
      'ここまで\n' +
      'もし、Fがhogeならば\n' +
      '    1を表示\n' +
      'ここまで',
      '1')
  })
  it('無名関数が警告を出す問題の修正 #841', async () => {
    let log = ''
    const nako = new NakoCompiler()
    nako.logger.addListener('warn', ({ noColor }) => { log += noColor })
    nako.parse(
      'f = 関数(x) それは、x。ここまで。\n' +
      'g = 関数(x) それは、x。ここまで。\n'
      , 'main.nako3')
    assert.strictEqual(log, '')
  })
  /*
  it('resetされた後に関数名を取得できない問題の修正 #849', (done) => {
    const nako = new NakoCompiler()
    nako.getLogger().addListener('stdout', (data) => {
      const { noColor } = data
      assert(noColor.includes('function')) // JavaScriptのコード function() { var ... } が表示されるはず
      done()
    })
    nako.run(`
●Aとは
ここまで
0.0001秒後には
    「A」のJSオブジェクト取得して表示
ここまで。
`, '')
    nako.reset()
    console.log(nako.compile(`\
●テスト:足すとは
    1と2を足す
    それと3がASSERT等しい
ここまで

●テスト:引くとは
    1と2を足す
    それと3がASSERT等しい
ここまで
`, 'main.nako3', true))
  })
  */
  //
  it('「AはBである」構文 #939', async () => {
    await cmp('Aは9である。Aを表示', '9')
    await cmp('Bは「あ」である。Bを表示', 'あ')
    await cmp('Cは[1,2,3]である;C[2]を表示', '3')
  })
  it('「AはBです」構文 #974', async () => {
    await cmp('Aは9です。Aを表示', '9')
    await cmp('Bは「あ」でした。Bを表示してください。', 'あ')
    await cmp('Cは[1,2,3]である;C[2]を表示', '3')
  })
  it('複数変数代入構文 #563', async () => {
    await cmp('A,B=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('A,B,C=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('A,B=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('A,B,C,D=[1,2,3,4];Dを表示;', '4')
  })
  it('複数定数代入構文 #563', async () => {
    await cmp('定数[A,B]=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('定数[A,B,C]=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('定数[A,B]=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('定数[A,B,C,D]=[1,2,3,4];Dを表示;', '4')
  })
  it('複数定数代入構文その2 #563', async () => {
    await cmp('変数[A,B]=[1,2];Aを表示;Bを表示', '1\n2')
    await cmp('変数[A,B,C]=[1,2,3];Aを表示;Bを表示;Cを表示', '1\n2\n3')
    await cmp('変数[A,B]=[1];Aを表示;Bを表示;', '1\nundefined')
    await cmp('変数[A,B,C,D]=[1,2,3,4];Dを表示;', '4')
  })
  it('複数代入文の問題 #1027', async () => {
    await cmp('塊=[[0,0],[1,1]];塊を反復\nx,y=対象;💧;塊をJSONエンコードして表示。', '[[0,0],[1,1]]')
    await cmp('x=1;y=2;x,y=[y,x];xを表示', '2')
  })
  it('もし文で「ならば」の前の空行でエラー #1079', async () => {
    await cmp('A=5;もし、A > 3　ならば「OK」と表示;', 'OK')
  })
  it('『増やす』『減らす』文の追加 #1145', async () => {
    // 増やす
    await cmp('A=0;Aを1増やす。Aと表示;', '1')
    await cmp('A=0;Aを123だけ増やす。Aと表示;', '123')
    // 減らす
    await cmp('A=10;Aを1減らす。Aと表示;', '9')
    await cmp('A=10;Aを5だけ減らす。Aと表示;', '5')
    // 初期化しないで使うと0になる
    await cmp('Aを3増やす;Aと表示;', '3')
    await cmp('Aを3減らす;Aと表示;', '-3')
  })
  it('『増やす』『減らす』文の追加 #1386 (core #86)', async () => {
    // 増やす
    await cmp('A=[5,5,5];A[0]を1増やす。A[0]と表示;', '6')
    await cmp('A={"R":15};A["R"]を1増やす。A["R"]と表示;', '16')
    // 減らす
    await cmp('A=[5,5,5];A[0]を1減らす。A[0]と表示;', '4')
    await cmp('A={"R":15};A["R"]を1減らす。A["R"]と表示;', '14')
  })
  it('文字列記号と全角コメント閉じ記号の組み合わせがある時うまく動いていない(core #45)', async () => {
    await cmp(
      'もし1ならば\n' +
      '　　1を表示 ／＊ 「 ＊／\n' +
      '　　2を表示\n' +
      'ここまで。\n' +
      '', '1\n2')
  })
})
