const _ = require('underscore');
const React = require('react');
const ReactDOM = require('react-dom');
const ColorPicker = require('react-color-picker');


const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789';


// from http://stackoverflow.com/a/13542669
const shadeColor2 = function(color, percent) {
    // formatting edited by me from original for clarity
    // percent should be a number between -1 and 1
    var f = parseInt(color.slice(1),16);
    var t = percent < 0 ? 0 : 255;
    var p = percent < 0 ? percent * -1 : percent;
    var R = f >> 16;
    var G = f >> 8 & 0x00FF;
    var B = f & 0x0000FF;
    return "#" + (0x1000000 +
            (Math.round((t - R) * p) + R) * 0x10000 +
            (Math.round((t - G) * p) + G) * 0x100 +
            (Math.round((t - B) * p) + B)
        ).toString(16).slice(1);
};

// from http://stackoverflow.com/a/901144
const getParameterByName = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" :
                        decodeURIComponent(results[1].replace(/\+/g, " "));
};

const Glyph = React.createClass({
    render: function() {
        const size = this.props.size || 80;
        const color = this.props.color || '#eeeeee';
        let textShadow = '';
        let fontWeight = 'normal';
        let background = '#222';
        if (size > 100) {
            fontWeight = 700;
            // 3D font text shadow from http://markdotto.com/playground/3d-text/
            textShadow =
                '0 2px 0 '+shadeColor2(color,  0.1)+',' +
                '0 3px 0 '+shadeColor2(color, -0.1)+',' +
                '0 4px 0 '+shadeColor2(color, -0.15)+',' +
                '0 5px 0 '+shadeColor2(color, -0.2)+',' +
                '0 6px 0 '+shadeColor2(color, -0.25)+',' +
                '0 7px 0 '+shadeColor2(color, -0.3)+',' +
                '0 8px 0 '+shadeColor2(color, -0.3)+',' +
                '0 7px 1px rgba(0,0,0,.1),'+
                '0 0 5px rgba(0,0,0,.1),'+
                '0 1px 3px rgba(0,0,0,.3),'+
                '0 3px 5px rgba(0,0,0,.2),'+
                '0 5px 10px rgba(0,0,0,.25),'+
                '0 10px 10px rgba(0,0,0,.2),'+
                '0 20px 20px rgba(0,0,0,.15)';
            background = 'radial-gradient(ellipse at center,'+
                         'rgba(100,100,100,1) 0%,'+
                         'rgba(60,60,60,1) 100%)';
        } else {
            textShadow =
                '0 1px 0 '+shadeColor2(color,  0.1)+',' +
                '0 2px 0 '+shadeColor2(color, -0.2)+',' +
                '0 3px 0 '+shadeColor2(color, -0.2)+',' +
                '0 4px 0 '+shadeColor2(color, -0.3)+',' +
                '0 7px 1px rgba(0,0,0,.1),'+
                '0 0 5px rgba(0,0,0,.1),'+
                '0 1px 3px rgba(0,0,0,.3),'+
                '0 3px 5px rgba(0,0,0,.3),';
            background = 'radial-gradient(ellipse at center,'+
                         'rgba(80,80,80,1) 0%,'+
                         'rgba(60,60,60,1) 100%)';
        }
        const letterStyles = {
            boxSizing: 'border-box',
            color: color,
            display: 'inline-block',
            fontSize: size * 0.7,
            lineHeight: size * 0.9 + 'px',
            padding: 1,
            textShadow: textShadow,
        };
        const squareStyles = {
            background: background,
            fontWeight: fontWeight,
            height: size,
            margin: 3,
            textAlign: 'center',
            width: size,
        };
        const styles = !this.props.showBackground ? letterStyles :
                                _.extend({}, letterStyles, squareStyles);
        return <span
                style={styles}
                key={this.props.key}
                onClick={this.props.onClick}>
            {this.props.children}
        </span>;
    }
});

const ColorPickerScreen = React.createClass({
    onDrag: function(color, c) {
        this.props.onColorChange(color);
    },
    render: function() {
        const glyph = this.props.activeGlyph;
        const glyphColor = this.props.activeColor;
        const size = 150;

        return <div>
            <Glyph
                showBackground={true}
                size={size}
                color={glyphColor}>
                {glyph}
            </Glyph>
            <div style={{
                display: 'inline-block',
                verticalAlign: 'top',
                margin: 3,
            }}>
            <ColorPicker
                key={glyphColor}
                defaultValue={glyphColor}
                color={glyphColor}
                saturationWidth={150}
                saturationHeight={150}
                hueWidth={20}
                onDrag={this.onDrag}/>
            </div>
        </div>;
    }
});

const App = React.createClass({
    getInitialState: function() {
        return {
            activeGlyph: glyphs[0],
            colors: this.getColors(),
            textValue: 'The quick brown fox jumps over the lazy dog',
            textAreaHeight: 300,
        };
    },
    getColors: function() {
        const colors = getParameterByName('colors');
        return colors.length ? JSON.parse(colors) : {};
    },
    onColorChange: function(color) {
        let colors = _.clone(this.state.colors);
        const glyph = this.state.activeGlyph;
        colors[glyph] = color;
        this.setState({
            colors: colors,
        });
    },
    componentDidMount: function() {
        this.setState({
            textAreaHeight: this.inputTextarea.scrollHeight,
        });
    },
    render: function() {
        const colors = this.state.colors;
        const activeGlyph = this.state.activeGlyph;
        const activeColor = colors[activeGlyph];

        const stringifyColors = encodeURIComponent(JSON.stringify(colors));
        const url = './?' + 'colors=' + stringifyColors;

        const printText = function(text) {
            return _.map(text.split("\n"), (line, lineIdx) => {

                const words = line.split(' ');
                return <div
                    key={lineIdx}
                    style={{
                        height: line.trim().length === 0 ? '92px' : 'auto',
                        wordWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {_.map(words, (word, wordIdx) => {

                        return <span key={wordIdx}>
                            <span style={{ display: 'inline-block' }}>
                            {_.map(word, (letter, letterIdx) => {
                                const color = colors[letter.toLowerCase()];
                                return <Glyph
                                    key={letterIdx}
                                    size={100}
                                    color={color}>
                                    {letter}
                                </Glyph>;
                            })}
                            </span>
                            {wordIdx !== words.length - 1 &&
                                <span style={{display: 'inline-block'}}>
                                    &nbsp;
                            </span>}
                        </span>;
                    })}
                </div>;
            });
        };

        return (<div>
            <div style={{
                        background: 'radial-gradient(ellipse at center,'+
                                    'rgba(100,100,100,1) 0%,'+
                                    'rgba(60,60,60,1) 100%)',
                        overflowY: 'auto',
                        position: 'absolute',
                        top: 0,
                        right: 390,
                        bottom: 0,
                        left: 0
                    }}>
                <div style={{
                    position: 'absolute',
                    boxSizing: 'border-box',
                    width: '100%',
                    zIndex: 1000,
                    padding: '20px 20px 40px',
                }}>
                    <textarea
                        type="text"
                        onkeyup="textAreaAdjust(this)"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            WebkitTextFillColor: 'transparent',
                            fontFamily: 'lato, sans-serif',
                            width: '100%',
                            height: (this.state.textAreaHeight) + "px",
                            overflow: 'hidden',
                            outline: 'none',
                            fontSize: 70,
                            lineHeight: '92px',
                            letterSpacing: '2px',
                            padding: 0,
                        }}
                        ref={(ref) => this.inputTextarea = ref}
                        onKeyUp={(e) => {
                            this.setState({
                                textAreaHeight: e.target.scrollHeight,
                            });
                        }}
                        value={this.state.textValue}
                        onChange={(e) => {
                            this.setState({
                                textValue: e.target.value
                            });
                        }}></textarea>
                </div>
                <div style={{
                            margin: '20px 20px 40px',
                            position: 'relative',
                            fontSize: 80,
                        }}>
                    {printText(this.state.textValue)}
                    <div style={{
                                opacity: 0.4,
                                position: 'absolute',
                                top: 0,
                                WebkitFilter: 'blur(14px)'
                            }}>
                        {printText(this.state.textValue)}
                    </div>
                </div>
            </div>
            <div style={{
                    background: '#222',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    padding: 20,
                    overflowY: 'auto',
                    textAlign: 'center',
                    width: 350,
                }}>
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <a
                            style={{
                                background: '#eee',
                                border: '1px solid #ddd',
                                borderRadius: 5,
                                boxSizing: 'border-box',
                                color: '#444',
                                display: 'inline-block',
                                fontSize: 20,
                                padding: 10,
                                textDecoration: 'none',
                                width: '100%',

                            }}
                            href={url}>Permalink these colors</a>
                    </div>
                    <ColorPickerScreen
                        activeGlyph={activeGlyph}
                        activeColor={activeColor}
                        onColorChange={this.onColorChange}/>
                </div>
                <div>
                    {_.map(glyphs, (glyph, idx) => {
                        const color = colors[glyph];

                        return <Glyph
                                key={glyph}
                                color={color}
                                size={51}
                                showBackground={true}
                                onClick={() => {
                                        this.setState({
                                            activeGlyph: glyph
                                        });
                                    }
                                }>
                            {glyph}
                        </Glyph>;
                    })}
                </div>
            </div>
        </div>);
    }
});

module.exports = App;