{
    $(".tab").on("click", function() {
        const index = $(this).index();
        $(this).css("border-width", "0"); 
        $(this).css("cursor", "default");
        switch (index) {
            case 0:
                $(this).siblings().css({"border-width": "0 0 1px 1px", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").removeClass("invisible");
                $("#main-sidebar > :nth-child(3)").addClass("invisible");
                break;
            case 1:
                $(this).siblings().css({"border-width": "0 1px 1px 0", "cursor": "pointer"});
                $("#main-sidebar > :nth-child(2)").addClass("invisible");
                $("#main-sidebar > :nth-child(3)").removeClass("invisible");
                break;
        }
    });
    
}