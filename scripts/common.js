let code;

$('#Confirm').click(() => {
    code = $('#Code').val();
    if (code.includes('return')) {
        $('#Input').hide();
        $('#Search').show();
    }
});
