function parseEmoticons( inputStr ){

  var emoticons = [
    {
      text: ':)',
      image: '1.png'
    },
    {
      text:';)',
      image: '2.png'
    }
  ];
  for ( var i = 0; i < emoticons.length; i++ ){
    inputStr = inputStr.split(emoticons[i].text).join('<img class="emo" src="/web/emoticons/'+emoticons[i].image+'">');
  }
  return inputStr;
}