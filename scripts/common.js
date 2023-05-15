let code = "";
let names = [], slots = [], items = [], amounts = [];

$('#Confirm').click(() => {
    code = $('#Code').val();
    if (code.includes('return')) {
        $('#Input').hide();
        $('#Search').show();
        [names, slots, items, amounts] = parse(code);
        
    }
});
