( function( $ ) {

    $(document).ready(function(){
        $(".wl_hf-nav-menu__toggle").click(function(){
            $(".wl_hf-nav-menu__submenu-arrow").toggleClass("active");
        });
    });

    $(document).ready(function(){
        $(".menu-item-has-children").click(function(){
            $(this).children(".menu-item-has-children .sub-menu").toggleClass("active");
            // $(this).toggleClass("active");
        });
    });



        $(document).ready(function() {
            const $navBoxes = $('.wl_hf-nav-menu__box');
            const $body = $('body');
            const $window = $(window);
            
            $(window).resize(function() {
                $navBoxes.each(function() {

                const $box = $(this);
                const isFullWidth = $box.data('full-width') === 'yes';

                if (!isFullWidth) return;

                var $horizontalElements = $box.find(".wl_hf-layout-horizontal");
                
                var bsContainerWidth = $("body").width()

                if (bsContainerWidth <= 1025) {

                    if ($(".elementor-widget-nav").hasClass("wl_hf-nav-menu__breakpoint-tablet")) {            
                        var width = $(window).width();
                        
                        var veleftwidth = $( 'body' ).offset().left - $('[data-full-width="yes"]').offset().left;
                        if ( $('.elementor-clickable').hasClass('wl_hf-nav-menu__toggle') ) {
                            $(".wl_hf-nav-menu__breakpoint-tablet .wl_hf-nav-menu__submenu-arrow").css("width", width);
                            $(".wl_hf-nav-menu__breakpoint-tablet .wl_hf-nav-menu__submenu-arrow").css("left", veleftwidth);
                            $(".wl_hf-nav-menu__breakpoint-tablet .wl_hf-nav-menu__submenu-arrow").css("overflow", 'hidden');
                        }
                    }
                } else if (bsContainerWidth <= 768) {
                    if ($(".elementor-widget-nav").hasClass("wl_hf-nav-menu__breakpoint-mobile")) {            
                        var width = $(window).width();
                        var veleftwidth = $( 'body' ).offset().left - $('[data-full-width="yes"]').offset().left;
                        if ( $('.elementor-clickable').hasClass('wl_hf-nav-menu__toggle') ) {
                            $(".wl_hf-nav-menu__breakpoint-mobile .wl_hf-nav-menu__submenu-arrow").css("width", width);
                            $(".wl_hf-nav-menu__breakpoint-mobile .wl_hf-nav-menu__submenu-arrow").css("left", veleftwidth);
                            $(".wl_hf-nav-menu__breakpoint-tablet .wl_hf-nav-menu__submenu-arrow").css("overflow", 'hidden');
                        }
                    }
                }

                });

            }).resize();
        });



} )( jQuery );