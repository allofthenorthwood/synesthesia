const _ = require('underscore');
const { StyleSheet, css } = require('./lib/aphrodite.js');
const React = require('react');
const ReactDOM = require('react-dom');
const ColorPicker = require('react-color-picker');
const { CompositeDecorator, ContentState, Editor, EditorState } = require('draft-js');


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

const SC = {
    // Style constants
    sidebarWidth: 200,
    sidebarPadding: 10,
    hueWidth: 10,
    glyphMargin: 2,

    outputTextSize: 30,
    letterSpacing: 2,
    lineHeight: 1.3,

    mediaMedium: `@media (max-width: 550px) and (min-width: 421px)`,
    mediaSmall: `@media (max-width: 420px)`,
};

const Glyph = (props) => {
    const size = props.size || 80;
    const color = props.color || '#eeeeee';
    let textShadow = '';
    let fontWeight = 'normal';
    let background = '#222';
    if (size > 50) {
        fontWeight = 700;
    }
    if (size > 25) {
        // 3D font text shadow from http://markdotto.com/playground/3d-text/
        textShadow =
            '0 1px 0 '+shadeColor2(color, -0.3)+',' +
            '0 2px 0 '+shadeColor2(color, -0.4)+',' +
            '0 4px 1px rgba(0,0,0,.2),'+
            '0 0 5px rgba(0,0,0,.2),'+
            '0 1px 3px rgba(0,0,0,.3),'+
            '0 0 42px rgba(255,255,255,0.5)';
    } else {
        textShadow =
            '0 1px 0 '+shadeColor2(color, -0.4)+',' +
            '0 2px 0 '+shadeColor2(color, -0.5)+',' +
            '0 3px 1px rgba(0,0,0,.2),'+
            '0 0 5px rgba(0,0,0,.1)';
    }
    const letterStyles = {
        color: color,
        fontSize: size,
        letterSpacing: props.noLetterSpacing ? 0 : SC.letterSpacing,
        textShadow: textShadow,
    };
    return <span style={letterStyles}>
        {props.children}
    </span>;
};

const SquareGlyph = (props) => {
    const size = props.size || 80;
    const squareStyles = {
        height: size,
        width: size,
    };
    return <span
        className={css(
            ST.square,
            props.link && ST.squareLink,
            props.link && props.active && ST.squareLinkActive
        )}
        style={squareStyles}
        onClick={props.onClick}
    >
        <Glyph
            {...props}
            noLetterSpacing={true}
            size={size / SC.lineHeight * 0.9}
        />
    </span>;
};

const ColorPickerScreen = React.createClass({
    onDrag: function(color, c) {
        this.props.onColorChange(color);
    },
    render: function() {
        const glyph = this.props.activeGlyph;
        const glyphColor = this.props.activeColor;
        const size = (SC.sidebarWidth -
            SC.hueWidth - 10 -
            4 * SC.glyphMargin) / 2;

        return <div>
            <SquareGlyph
                showBackground={true}
                size={size}
                color={glyphColor}>
                {glyph}
            </SquareGlyph>
            <div className={css(ST.colorPickerWrapper)}>
            <ColorPicker
                key={glyphColor}
                defaultValue={glyphColor}
                color={glyphColor}
                saturationWidth={size}
                saturationHeight={size}
                hueWidth={SC.hueWidth}
                onDrag={this.onDrag}/>
            </div>
        </div>;
    }
});

const getDecoratorForColors = (colors) => {
    return new CompositeDecorator([{
        strategy: (contentBlock, callback) => {
            const text = contentBlock.getText();
            for (let ii = 0; ii < text.length; ii++) {
                callback(ii, ii + 1);
            }
        },
        component: (props) => {
            // TODO: This isn't public Draft.js API.
            const letter = props.children.map((leaf) => leaf.props.text).join('');
            const color = colors[letter.toLowerCase()];
            return <Glyph
                size={SC.outputTextSize}
                color={color}>
                {props.children}
            </Glyph>;
        },
    }]);
};

const App = React.createClass({
    getInitialState: function() {
        const text = `The quick brown fox jumps over the lazy dog

Hi my name is _________

16777216
33554432`;
        const colors = this.getColors();

        return {
            activeGlyph: glyphs[0],
            colors: colors,
            editorState: EditorState.createWithContent(
                ContentState.createFromText(text),
                getDecoratorForColors(colors)
            ),
        };
    },
    getColors: function() {
        const colors = getParameterByName('colors');
        return colors.length ? JSON.parse(colors) : {};
    },
    onEditorChange: function(editorState) {
      this.setState({editorState});
    },
    onColorChange: function(color) {
        let colors = _.clone(this.state.colors);
        const glyph = this.state.activeGlyph;
        colors[glyph] = color;
        this.setState({
            colors: colors,
            editorState: EditorState.set(this.state.editorState, {
                decorator: getDecoratorForColors(colors),
            })
        });
    },
    render: function() {
        const colors = this.state.colors;
        const activeGlyph = this.state.activeGlyph;
        const activeColor = colors[activeGlyph];

        const stringifyColors = encodeURIComponent(JSON.stringify(colors));
        const url = '?' + 'colors=' + stringifyColors;

        const glyphButtonSize = SC.sidebarWidth

        return (<div>
            <div className={css(ST.textContainer)}>
                <div className={css(ST.innerTextContainer)}>
                    <div className={css(ST.outputTextContent)}>
                        <Editor
                            editorState={this.state.editorState}
                            onChange={this.onEditorChange} />
                    </div>
                </div>
            </div>
            <div className={css(ST.sidebar)}>
                <div className={css(ST.sidebarTopContent)}>
                    <a
                        className={css(ST.button)}
                        href={url}
                    >
                        Permalink these colors
                    </a>
                    <ColorPickerScreen
                        activeGlyph={activeGlyph}
                        activeColor={activeColor}
                        onColorChange={this.onColorChange}/>
                </div>
                <div className={css(ST.sidebarBottomContent)}>
                    {_.map(glyphs, (glyph, idx) => {
                        const color = colors[glyph];
                        const glyphsPerRow = 6;
                        const glyphSize = Math.floor(
                            (SC.sidebarWidth -
                            (glyphsPerRow * 2) * SC.glyphMargin) /
                            glyphsPerRow
                        );

                        return <SquareGlyph
                                active={activeGlyph === glyph}
                                key={glyph}
                                color={color}
                                size={glyphSize}
                                showBackground={true}
                                link={true}
                                onClick={() => {
                                        this.setState({
                                            activeGlyph: glyph
                                        });
                                    }
                                }>
                            {glyph}
                        </SquareGlyph>;
                    })}
                </div>
            </div>
        </div>);
    }
});

const ST = StyleSheet.create({
    colorPickerWrapper: {
        display: 'inline-block',
        verticalAlign: 'top',
        margin: SC.glyphMargin,
    },

    textContainer: {
        background: 'radial-gradient(ellipse at center,'+
                    'rgba(100,100,100,1) 0%,'+
                    'rgba(60,60,60,1) 100%)',
        overflowY: 'auto',
        position: 'absolute',
        top: 0,
        right: SC.sidebarWidth + 2 * SC.sidebarPadding,
        bottom: 0,
        left: 0,
        [SC.mediaMedium]: {
            position: 'relative',
            height: 300,
        },
        [SC.mediaSmall]: {
            position: 'relative',
            height: 300,
        },
    },
    innerTextContainer: {
        boxSizing: 'border-box',
        fontSize: SC.outputTextSize,
        letterSpacing: SC.letterSpacing,
        lineHeight: SC.lineHeight,
        padding: '20px 20px 40px',
        position: 'absolute',
        width: '100%',
    },

    sidebar: {
        background: '#222',
        boxSizing: 'border-box',
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        padding: SC.sidebarPadding,
        overflowY: 'auto',
        textAlign: 'center',
        width: SC.sidebarWidth + 2 * SC.sidebarPadding,
        [SC.mediaMedium]: {
            width: '100%',
            position: 'relative',
        },
        [SC.mediaSmall]: {
            width: '100%',
            position: 'relative',
        },
    },
    sidebarTopContent: {
        [SC.mediaMedium]: {
            float: 'left',
            marginRight: 10,
        },
        [SC.mediaSmall]: {
            display: 'inline-block',
        },
    },
    sidebarBottomContent: {
        [SC.mediaMedium]: {
            marginLeft: SC.sidebarWidth + 10,
        },
    },
    button: {
        background: '#eee',
        border: '1px solid #ddd',
        borderRadius: 3,
        boxSizing: 'border-box',
        color: '#444',
        display: 'inline-block',
        fontSize: 12,
        margin: 2,
        marginBottom: 5,
        padding: 5,
        textDecoration: 'none',
        transition: 'all 0.2s',
        transitionProperty: 'color, background',
        width: '100%',
        ':hover': {
            background: '#d4d4d4',
            color: '#222',
        },
    },

    square: {
        background: 'radial-gradient(ellipse at center,'+
            'rgba(90,90,90,1) 0%,'+
            'rgba(60,60,60,1) 100%)',
        display: 'inline-block',
        lineHeight: SC.lineHeight,
        margin: SC.glyphMargin,
        textAlign: 'center',
    },
    squareLink: {
        cursor: 'pointer',
        ':hover': {
            background: 'radial-gradient(ellipse at center,'+
                'rgba(60,60,60,1) 0%,'+
                'rgba(40,40,40,1) 100%)',
        }
    },
    squareLinkActive: {
        background: 'radial-gradient(ellipse at center,'+
            'rgba(60,60,60,1) 0%,'+
            'rgba(40,40,40,1) 100%)',
    },
});

module.exports = App;
