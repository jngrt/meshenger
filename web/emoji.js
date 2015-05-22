function parseEmoticons( inputStr ){

  var emoticons = [
    {
      text: ':)',
      image: '1.png'
    },
    {
      text: '<iframe',
      image: 'iframe-open.png'
    },
    {
      text: '</iframe>',
      image: 'iframe-close.png'
    },
    {
      text: '<script',
      image: 'script-open.gif'
    },
    {
      text: '</script>',
      image: 'script-close.gif'
    },
    {
      text: '<style',
      image: 'style-open.png'
    },
    {
      text: '</style>',
      image: 'style-close.png'
    },
    {
      text:';)',
      image: '2.png'
    },
    {
      text:':rock:',
      image: '3.png'
    }
  ];
  for ( var i = 0; i < emoticons.length; i++ ){
    inputStr = inputStr.split(emoticons[i].text).join('<img class="emo" src="/web/emoticons/'+emoticons[i].image+'">');
  }
  return inputStr;
}