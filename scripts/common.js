let x = 0;
let data = $.ajax({
    type: "GET",
    url: "/data.json",
    dataType: "json",
}).done(() => {
    $('body').prepend('<button>this</button>');
    data = data.responseJSON;
});
$('.startoptions div:nth-child(1)').click(function() { 
    $(this).parent().hide();
});
$('.startoptions div:nth-child(3)').click(function() {
    window.close();
});
$('button').click(function() {
    x += 1;
    $('p').text(data.test[0]);
});
