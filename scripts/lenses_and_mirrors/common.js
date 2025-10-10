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

    $("#main-sidebar > div:nth-child(2) > div").on("click", function() {
        let element = {id: c.element_id, name:"New Element", type: "lens", position: [0, 0], unit_vector: [0, 1], focal_length: 200, size: 400, density: 10};
        switch($(this).index()) {
            case 1:
                element.focal_length = -200;
                break;
            case 2:
                element.type = "mirror";
                element.focal_length = -200;
                break;
            case 3:
                element.type = "mirror";
                break;
            case 5:
                element.type = "barrier";
                break;
            case 6:
                element.type = "point";
                break;
            case 7:
                element.type = "parallel";
                break;
        }

        c.add_element($(this).index() <= 5 ? 1 : 0, element);

        $("#main-sidebar > div:nth-child(3)").append(`<div data-id="${c.element_id++}">New Element</div>`);
    });

    $("#main-sidebar > div:nth-child(3)").on("click", "> div", function() {
        if (+$(this).data("id") === c.selected_element.selected) {
            c.selected_element.selected = -1;
            $(this).css("color","");
        } else {
            c.selected_element.selected = +$(this).data("id");
            $(this).siblings().css("color","");
            $(this).css("color","limegreen");
        }
        console.log($(this).index());
    }).on("mouseenter", "> div", function () {
        c.selected_element.hovered = +$(this).data("id");
        console.log(c.selected_element.hovered);
    }).on("mouseleave", "> div", function() {
        c.selected_element.hovered = -1;
        console.log(c.selected_element.hovered);
    });


}