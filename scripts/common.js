let x = 0;
let data = $.ajax({
    type: "GET",
    url: "/data.json",
    dataType: "json"
}).done(() => {
    $('body').prepend('<button>this</button>');
    data = data.responseJSON;
    $('button').click(function() {
        x += 1;
        $('p').text(data.test[x]);
        $.ajax({
            type: "POST",
            url: "/data.json",
            data: {"test":[x]}
        });
    });
});
$('.startoptions div:nth-child(1)').click(function() { 
    $(this).parent().hide();
});
$('.startoptions div:nth-child(3)').click(function() {
    window.close();
});
