let x = 0;
$('.startoptions div:nth-child(1)').click(function() { 
    $(this).parent().hide();
});
$('.startoptions div:nth-child(3)').click(function() {
    window.close();
});
$('button').click(function() {
    x += 1;
    $('p').text(x);
});
