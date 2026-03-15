fetch('../assets/images/Tamil99.svg')
  .then(resp => resp.text())
  .then(svg => {
    document.getElementById('keyboard').innerHTML = svg;
  });



