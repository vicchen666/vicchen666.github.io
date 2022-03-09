$('.startoptions div').hover(function () {
        $(this).css('font-size: 35px;')
    }, function () {
        $(this).css('font-size: 30px;')
    }
);
$('.startoptions div:nth-child(1)').click(function() { 
    $(this).hide();
});
$('.startoptions div:nth-child(3)').click(function() {
    window.close();
});
