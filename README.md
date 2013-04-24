FireText
========

FireText is a word processor for Firefox OS that saves docs in the ODML format.  FireText can also open html, and plain text files (more will be added later).

You can run it on a Firefox OS device, or on the <a href="https://addons.mozilla.org/en-US/firefox/addon/firefox-os-simulator/">simulator</a>.


## What is ODML?
ODML stands for Open Document Markup Language.  It has not been standardized yet, but we hope this project will bring it to the attention of the W3C.

An example ODML document:
```` HTML
<!DOCTYPE odml>
<odml>
  <info>
    <title>Sample ODML Document</title>
    <author>Joshua Smith</author>
    <publisher>Myself</publisher>
    <date>4/22/13</date>
  </info>
  <content>
    ...Some HTML Content...
  </content>
</odml>
````

For more information and documentation see <a href="https://github.com/Joshua-S/FireText/wiki/ODML">our wiki</a>.
