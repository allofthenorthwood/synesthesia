const _ = require('underscore');
const React = require('react');
const ColorPicker = require('react-color-picker');


const glyphs = 'abcdefghijklmnopqrstuvwxyz0123456789';

// from http://stackoverflow.com/a/901144
const getParameterByName = function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

const Glyph = React.createClass({
    render: function() {
        const size = this.props.size || 80;
        const styles = {
            display: 'inline-block',
            border: '1px solid #eee',
            margin: 5,
            background: '#fff',
            width: size,
            lineHeight: size + 'px',
            height: size,
            fontSize: size / 2,
            textAlign: 'center',
        };
        return <span
                style={_.extend(styles, this.props.style)}
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
        const glyphColor = this.props.activeColor || '#999';
        const size = 160;

        return <div>
            <ColorPicker
                key={glyphColor}
                defaultValue={glyphColor}
                color={glyphColor}
                onDrag={this.onDrag}/>
            {_.map(this.props.displayModeStyles, (style, idx) => {
                return <Glyph
                    size={size}
                    key={idx}
                    onClick={() => {
                        this.props.onDisplayModeChange(idx);
                    }}
                    style={style}>
                    {glyph}
                </Glyph>
            })}
        </div>;
    }
});

const App = React.createClass({
    getInitialState: function() {
        return {
            activeGlyph: glyphs[0],
            colors: this.getColors(),
            displayModes: this.getDisplayModes(),
        };
    },
    getColors: function() {
        const colors = getParameterByName('colors');
        return colors.length ? JSON.parse(colors) : {};
    },
    getDisplayModes: function() {
        const displayModes = getParameterByName('displayModes');
        return displayModes.length ? JSON.parse(displayModes) : {};
    },
    onColorChange: function(color) {
        let colors = _.clone(this.state.colors);
        const glyph = this.state.activeGlyph;
        colors[glyph] = color;
        this.setState({
            colors: colors,
        })
    },
    onDisplayModeChange: function(displayMode) {
        let displayModes = _.clone(this.state.displayModes);
        const glyph = this.state.activeGlyph;
        displayModes[glyph] = displayMode;
        this.setState({
            displayModes: displayModes,
        })
    },
    render: function() {
        const colors = this.state.colors;
        const displayModes = this.state.displayModes;
        const activeGlyph = this.state.activeGlyph;
        const activeColor = colors[activeGlyph];

        const stringifyColors = encodeURIComponent(JSON.stringify(colors));
        const stringifyDisplayModes = encodeURIComponent(JSON.stringify(displayModes));
        const url = 'http://localhost:8090/?' +
            'colors=' + stringifyColors +
            '&displayModes=' + stringifyDisplayModes;

        const displayModeStyle = function(color, mode) {
            const styles = [
                {
                    background: color,
                    color: '#eee'
                },
                {
                    color: color,
                    background: '#eee'
                },
                {
                    background: color,
                    color: '#444'
                },
                {
                    color: color,
                    background: '#444'
                }
            ];
            return mode != null ? styles[mode] : styles;
        };

        return (<div>
            <div style={{
                    display: 'flex'
                }}>
                <div style={{
                            width: '380px',
                            textAlign: 'center'
                        }}>
                    <ColorPickerScreen
                        activeGlyph={activeGlyph}
                        activeColor={activeColor}
                        onColorChange={this.onColorChange}
                        displayModeStyles={displayModeStyle(activeColor)}
                        onDisplayModeChange={this.onDisplayModeChange}/>

                    <div style={{ textAlign: 'center' }}>
                        <a
                            style={{
                                background: '#eee',
                                border: '1px solid #ddd',
                                padding: 10,
                                borderRadius: 5,
                                display: 'inline-block',
                                textDecoration: 'none',
                                color: '#444'

                            }}
                            href={url}>Permalink</a>
                    </div>
                </div>
                <div style={{
                            flex: 1
                        }}>
                    {_.map(glyphs, (glyph, idx) => {
                        const color = colors[glyph];
                        const displayMode = displayModes[glyph] || 0;
                        const style = displayModeStyle(colors[glyph], displayMode);
                        console.log(displayMode)
                        return <Glyph
                                key={glyph}
                                style={style}
                                onClick={() => {
                                    this.setState({
                                        activeGlyph: glyph
                                    })}
                                }>
                            {glyph}
                        </Glyph>;
                    })}
                </div>
            </div>
        </div>);
    }
});

React.render(<App />, document.body);