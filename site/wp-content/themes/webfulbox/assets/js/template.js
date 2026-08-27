// JavaScript Document
(function($) {
    "use strict";
	
	//calling foundation js
	$(document).foundation();
	
	$(window).on("load",function(){
		//Header Icons Width
		var window_width = $(window).width();
		
		var icons_width = $(".header .right-icons").width();
	
		if(icons_width > 2) {
			icons_width = icons_width+2;
		}
		
		if(window_width > 1023) {
			$(".header .navigation").css({ 'width': 'calc(100% - ' + icons_width+ 'px)' });
		}

		if(window_width < 640) {
			$('.header .right-icons').appendTo('#responsive-menu');

			$('.wc_header_type_displaytype-four.large-9 .topBar').appendTo('.appendTopBar');
		}

		//Logo div width.
		var logo_width = $(".header.type-five .logo").width();

		if(logo_width > 2) {
			if(window_width > 1023) {
				
				logo_width = logo_width+32;

				$(".logo_wrapper").css({ 'width': +logo_width+'px' });	

				var icons_box_width = $(".header-five-icons-box").width();

				var deduct_width = icons_box_width+logo_width+32;

				$(".header .nav-wrap.nav-dark").css({ 'width': 'calc(100% - ' + deduct_width + 'px)' });	

			}	
		}
	});	
	
	//calling Brand Crousel
	$(".main-banner").owlCarousel({
		loop:true,
		margin:5,
    	responsiveClass:true,
		slideSpeed : 2000,
		nav: true,
		autoplay: true,
		responsiveRefreshRate : 200,
		rewind:true,
		responsive:{
			0:{
				items:1,
				nav:true,
				navText:["<i class='fa fa-chevron-left'></i>","<i class='fa fa-chevron-right'></i>"]
			},
			600:{
				items:1,
				nav:false,
				navText:["<i class='fa fa-chevron-left'></i>","<i class='fa fa-chevron-right'></i>"]
			},
			1000:{
				items:1,
				nav:true,
				navText:["<i class='fa fa-chevron-left'></i>","<i class='fa fa-chevron-right'></i>"],
				loop:true
			}
		}
	});
	
	$(".testimonial-slid").owlCarousel({
		loop:true,
		responsiveClass:true,
		margin:10,
    	autoplayHoverPause:true,
		responsive:{
			0:{
				items:1,
				loop:true
			},
			600:{
				items:1,
				loop:true
			},
			1000:{
				items:1,
				loop:true
			}
		}
	});
		
	//Our Partners Crousel
	$(".partners").owlCarousel({
		loop:true,
		responsiveClass:true,
		margin:10,
		autoplay:true,
		smartSpeed:3000,
		slideSpeed:60,
		autoplayTimeout:2000,
		autoplayHoverPause:true,
		responsive:{
			0:{
				items:2,
				loop:true
			},
			600:{
				items:5,
				loop:true
			},
			1000:{
				items:5,
				loop:true
			}
		}
	});
	
	//Hover Effect
	$(".single-sub").on('mouseenter', function () {
		$(this).children('.submenu').slideDown(400);
	}).on('mouseleave', function() {
		$(this).children('.submenu').slideUp(400);
	});
	
	//TwentyTwenty Plugin Starter.
	$(window).on("load", function() {
		$(".twentytwenty-container[data-orientation!='vertical']").twentytwenty();
	});
	
	//Saying page loaded
	$(window).on("load",function(){
		$("body").addClass("loaded");
		$(".preloader").html("");
		$(".preloader").css("display", "none");
	 });
	
	//Display Scroll Btn on 1000px
	$(window).on("scroll",function() { 
		if($(this).scrollTop() > 1000) { 
			$("#top").fadeIn();
		} else { 
			$("#top").fadeOut();
		}
	});
	
	//scroll effect
	$("#top").on("click",function () {
		$("html, body").animate({ scrollTop: 0 }, "slow");
		return false;
	});        
	
	//Moving Top 
	$("#top").on("click",function (event) {
		event.stopPropagation();                
		var idTo = $(this).attr("data-atr");                
		var Position = $("[id='" + idTo + "']").offset();
		$("html, body").animate({ scrollTop: Position }, "slow");
		return false;
	});
})(jQuery); //jQuery main function ends strict Mode on