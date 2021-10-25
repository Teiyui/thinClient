/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

button {
    margin: 10px 20px 25px 0;
    vertical-align: top;
    width: 134px;
}

table
{
    border-collapse:collapse;
}
table,th, td
{
    border: 1px solid black;
}

textarea {
    color: #444;
    font-size: 0.9em;
    font-weight: 300;
    height: 20.0em;
    padding: 5px;
    width: calc(100% - 10px);
}

div#getUserMedia {
    padding: 0 0 8px 0;
}

div.input {
    display: inline-block;
    margin: 0 4px 0 0;
    vertical-align: top;
    width: 310px;
}

div.input > div {
    margin: 0 0 20px 0;
    vertical-align: top;
}

div.output {
    background-color: #eee;
    display: inline-block;
    font-family: 'Inconsolata', 'Courier New', monospace;
    font-size: 0.9em;
    padding: 10px 10px 10px 25px;
    position: relative;
    top: 10px;
    white-space: pre;
    width: 270px;
}

div#preview {
    border-bottom: 1px solid #eee;
    margin: 0 0 1em 0;
    padding: 0 0 0.5em 0;
}

div#preview > div {
    display: inline-block;
    vertical-align: top;
    width: calc(50% - 12px);
}

section#statistics div {
    display: inline-block;
    font-family: 'Inconsolata', 'Courier New', monospace;
    vertical-align: top;
    width: 308px;
}

section#statistics div#senderStats {
    margin: 0 20px 0 0;
}

section#constraints > div {
    margin: 0 0 20px 0;
}

h2 {
    margin: 0 0 1em 0;
}


section#constraints label {
    display: inline-block;
    width: 156px;
}

section {
    margin: 0 0 20px 0;
    padding: 0 0 15px 0;
}

video {
    background: #222;
    margin: 0 0 0 0;
    --width: 100%;
    width: var(--width);
    height: 225px;
}

@media screen and (max-width: 720px) {
    button {
        font-weight: 500;
        height: 56px;
        line-height: 1.3em;
        width: 90px;
    }

    div#getUserMedia {
        padding: 0 0 40px 0;
    }

    section#statistics div {
        width: calc(50% - 14px);
    }

}

