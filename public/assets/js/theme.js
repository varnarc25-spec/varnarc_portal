/*
Template:  		Quickai HTML5 Template
Written by: 	Harnish Design - (http://www.harnishdesign.net)
*/

(function ($) {
	"use strict";

// Preloader
$(window).on('load', function () {
	$('[data-loader="circle-side"]').fadeOut(); // will first fade out the loading animation
	$('#preloader').delay(333).fadeOut('slow'); // will fade out the white DIV that covers the website.
	$('body').delay(333);
});
	 
/*---------------------------------------------------
    Primary Menu
----------------------------------------------------- */

// Dropdown show on hover (desktop)
$('.primary-menu ul.navbar-nav li.dropdown, .login-signup ul.navbar-nav li.dropdown').not('.landing-nav-signed-in-services').on("mouseover", function() {
	if ($(window).width() > 991) {
		$(this).find('> .dropdown-menu').stop().slideDown('fast');
		$(this).bind('mouseleave', function() {
		$(this).find('> .dropdown-menu').stop().css('display', 'none'); 
		});

// When dropdown going off to the out of the screen.
	$('.primary-menu ul.navbar-nav > li.dropdown > .dropdown-menu').each(function() {
		if ($(this).hasClass('landing-services-mega')) {
			return;
		}
		var menu = $('#header .header-row').offset();
		var dropdown = $(this).parent().offset();
		if ($("html").attr("dir") == 'rtl') {
			var rd = ($(window).width() - (dropdown.left + $(this).parent().outerWidth()));
			var i = (rd + $(this).outerWidth()) - (menu.left + $('#header .header-row').outerWidth());
		}else{
			var i = (dropdown.left + $(this).outerWidth()) - (menu.left + $('#header .header-row').outerWidth());
		}
		if (i > 0) {
			if ($("html").attr("dir") == 'rtl') {
				$(this).css('margin-right', '-' + (i) + 'px');
			}else{
				$(this).css('margin-left', '-' + (i) + 'px');
			}
		}
	});
  }
});

$(function () {
    $(".dropdown li").on('mouseenter mouseleave', function (e) {
		if ($(window).width() > 991) {
			if ($('.dropdown-menu', this).length) {
            var elm = $('.dropdown-menu', this);
            var off = elm.offset();
            var l = off.left;
            var w = elm.width();
            var docW = $(window).width();
            var lr = ($(window).width() - (off.left + elm.outerWidth())); //offset right
				if ($("html").attr("dir") == 'rtl') {
					var isEntirelyVisible = (lr + w + 30 <= docW);
				}else{
					var isEntirelyVisible = (l + w + 30 <= docW);
				}
            if (!isEntirelyVisible) {
                $(elm).addClass('dropdown-menu-end');
				$(elm).parents('.dropdown:first').find('> a.dropdown-toggle > .arrow').addClass('arrow-end');
            } else {
                $(elm).removeClass('dropdown-menu-end');
				$(elm).parents('.dropdown:first').find('> a.dropdown-toggle > .arrow').removeClass('arrow-end');
            }
			}
		}
    });
});

// Login-signup dropdown
	$('.login-signup ul.navbar-nav > li.dropdown > .dropdown-menu').each(function() {
		var menu = $('#header .header-row').offset();
		var dropdown = $(this).parent().offset();
		if ($("html").attr("dir") == 'rtl') {
			var rd = ($(window).width() - (dropdown.left + $(this).parent().outerWidth()));
			var i = (rd + $(this).outerWidth()) - (menu.left + $('#header .header-row').outerWidth());
		}else{
			var i = (dropdown.left + $(this).outerWidth()) - (menu.left + $('#header .header-row').outerWidth());
		}
		if (i > 0) {
			if ($("html").attr("dir") == 'rtl') {
				$(this).css('margin-right', '-' + (i) + 'px');
			}else{
				$(this).css('margin-left', '-' + (i) + 'px');
			}
		}
	});

$(function () {
    $(".login-signup .dropdown li").on('click', function (e) {
			if ($('.dropdown-menu', this).length) {
				var elm = $('.dropdown-menu', this);
				var off = elm.offset();
				var l = off.left;
				var w = elm.width();
				var docW = $(window).width();
				var lr = ($(window).width() - (off.left + elm.outerWidth())); //offset right
				if ($("html").attr("dir") == 'rtl') {
					var isEntirelyVisible = (lr + w + 30 <= docW);
				}else{
					var isEntirelyVisible = (l + w + 30 <= docW);
				}
				if (!isEntirelyVisible) {
					$(elm).toggleClass('dropdown-menu-end');
					$(elm).parents('.dropdown:first').find('> a.dropdown-toggle > .arrow').toggleClass('arrow-end');
				}
			}
    });
});

// DropDown Arrow (skip mega-panel section headings — arrows read as stray “icons” next to full-width menus)
$('.primary-menu, .login-signup').find('a.dropdown-toggle').not('.landing-mega-section-toggle').append($('<i />').addClass('arrow'));

// Mobile Collapse Nav
$('.primary-menu .dropdown-toggle[href="#"], .primary-menu .dropdown-toggle[href!="#"] .arrow, .login-signup .dropdown-toggle[href="#"], .login-signup .dropdown-toggle[href!="#"] .arrow').on('click', function(e) {
	if ($(window).width() < 991) {
        e.preventDefault();
        var $parentli = $(this).closest('li');
        $parentli.siblings('li').find('.dropdown-menu:visible').slideUp();
        $parentli.find('> .dropdown-menu').stop().slideToggle();
        $parentli.siblings('li').find('a .arrow.open').toggleClass('open');
		$parentli.find('> a .arrow').toggleClass('open');
	}
});

// Landing signed-in multilevel menu: hover on desktop, click on mobile (breakpoint >991)
$(function () {
	function landingNavDesktop() {
		return $(window).width() > 991;
	}
	function closeSignedInNavMenus($exceptLi) {
		$('.landing-nav-signed-in-services').not($exceptLi || []).each(function () {
			var $li = $(this);
			$li.find('> .dropdown-menu').stop(true, true).slideUp('fast');
			$li.removeClass('show').find('> a .arrow').removeClass('open');
			$li.find('.dropend').removeClass('show').children('.dropdown-menu').hide();
		});
	}
	$('.primary-menu .landing-nav-signed-in-services.landing-nav-multilevel').on('mouseenter', function () {
		if (!landingNavDesktop()) {
			return;
		}
		var $li = $(this);
		closeSignedInNavMenus($li);
		$li.find('> .dropdown-menu').stop(true, true).slideDown('fast');
		$li.addClass('show').find('> a .arrow').addClass('open');
	}).on('mouseleave', function () {
		if (!landingNavDesktop()) {
			return;
		}
		var $li = $(this);
		$li.find('> .dropdown-menu').stop(true, true).slideUp('fast');
		$li.removeClass('show').find('> a .arrow').removeClass('open');
		$li.find('.dropend').removeClass('show').children('.dropdown-menu').hide();
	});
	$(document).on('mouseenter', '.landing-nav-multilevel .dropend', function () {
		if (!landingNavDesktop()) {
			return;
		}
		var $dropend = $(this);
		$dropend.siblings('.dropend').removeClass('show').children('.dropdown-menu').hide();
		$dropend.addClass('show').children('.dropdown-menu').show();
	}).on('mouseleave', '.landing-nav-multilevel .dropend', function () {
		if (!landingNavDesktop()) {
			return;
		}
		$(this).removeClass('show').children('.dropdown-menu').hide();
	});
	$(document).on('click.landingSignedInMegaClose', function (e) {
		if (!landingNavDesktop()) {
			return;
		}
		if ($(e.target).closest('.landing-nav-signed-in-services').length) {
			return;
		}
		closeSignedInNavMenus();
	});
});
	
// Mobile Menu Button Icon
$('.navbar-toggler').on('click', function() {
	$(this).toggleClass('open');
});


// OTP Form (Focusing on next input)
$("#otp-screen .form-control").keyup(function() {  
if (this.value.length == 0) {
   $(this).blur().parent().prev().children('.form-control').focus();
}
else if (this.value.length == this.maxLength) {
   $(this).blur().parent().next().children('.form-control').focus();
}
});

/*---------------------------------------------
    Booking (Flights, Train, Bus, Hotels, )
---------------------------------------------- */

/* Flights Travellers and Class */
$('#flightTravellersClass').on('click', function() {
        $('.travellers-dropdown').slideToggle('fast');
		/* Change value of Travellers and Class */
		$('.qty-spinner, .flight-class').on('change', function() {
        var ids = ['flightAdult', 'flightChildren', 'flightInfants'];
		var totalCount = ids.reduce(function (prev, id) {
			return parseInt($('#' + id + '-travellers').val()) + prev}, 0);
        var fc = $('input[name="flight-class"]:checked  + label').text();
        $('#flightTravellersClass').val(totalCount + ' - ' + fc);
    }).trigger('change');
    });
	
	/* Trains Travellers and Class */
	$('#trainTravellersClass').on('click', function() {
        $('.travellers-dropdown').slideToggle('fast');
		/* Change value of Travellers and Class */
		$('.qty-spinner, #train-class').on('change', function() {
        var ids = ['trainAdult', 'trainChildren', 'trainInfants'];
		var totalCount = ids.reduce(function (prev, id) {
			return parseInt($('#' + id + '-travellers').val()) + prev}, 0);
		var fc = $('#train-class option:selected').text();
		
        $('#trainTravellersClass').val(totalCount + ' - ' + fc);
    }).trigger('change');
    });
	
	/* Bus Seats */
	$('#busTravellersClass').on('click', function() {
        $('.travellers-dropdown').slideToggle('fast');
		/* Change value of Seats */
		$('.qty-spinner').on('change', function() {
        var ids = ['adult'];
		var totalCount = ids.reduce(function (prev, id) {
			return parseInt($('#' + id + '-travellers').val()) + prev}, 0);
		
        $('#busTravellersClass').val(totalCount + '  ' + 'Seats');
    }).trigger('change');
    });
	
	/* Hotels People / Rooms */
	$('#hotelsTravellersClass').on('click', function() {
        $('.travellers-dropdown').slideToggle('fast');
		/* Change value of People */
		$('.qty-spinner').on('change', function() {
        var ids = ['adult', 'children'];
		var totalCount = ids.reduce(function (prev, id) {
			return parseInt($('#' + id + '-travellers').val()) + prev}, 0)+ ' ' +'People';
			
		var idsRoom = ['hotels-rooms'];
		var totalCountRoom = idsRoom.reduce(function (prev, id) {
			return parseInt($('#hotels-rooms').val()) + prev}, 0)+ ' ' +'Room';
		
        $('#hotelsTravellersClass').val(totalCountRoom + ' / ' + totalCount);
    }).trigger('change');
    });
	
	/* Hide dropdown when clicking outside */
	$(document).on('click', function(event) {
    if (!$(event.target).closest(".travellers-class").length) {
        $(".travellers-dropdown").hide();
    }
	
	/* Hide dropdown when clicking on Done Button */
	$('.submit-done').on('click', function() {
        $('.travellers-dropdown').fadeOut(function() {
            $(this).hide();
        });
    });
});

/*-------------------------------------------
   Carousel (Owl Carousel)
--------------------------------------------- */
$(".owl-carousel").each(function (index) {
    var a = $(this);
	if ($("html").attr("dir") == 'rtl') {
		var rtlVal = true
	}else{
		var rtlVal = false
    }
	$(this).owlCarousel({
		rtl: rtlVal,
		autoplay: a.data('autoplay'),
		center: a.data('center'),
		autoplayTimeout: a.data('autoplaytimeout'),
		autoplayHoverPause: a.data('autoplayhoverpause'),
		loop: a.data('loop'),
		speed: a.data('speed'),
		nav: a.data('nav'),
		dots: a.data('dots'),
		autoHeight: a.data('autoheight'),
		autoWidth: a.data('autowidth'),
		margin: a.data('margin'),
		stagePadding: a.data('stagepadding'),
		slideBy: a.data('slideby'),
		lazyLoad: a.data('lazyload'),
		navText:['<i class="fa fa-chevron-left"></i>', '<i class="fa fa-chevron-right"></i>'],
		animateOut: a.data('animateout'),
		animateIn: a.data('animatein'),
		video: a.data('video'),
		items: a.data('items'),
		responsive:{
        0:{items: a.data('items-xs'),},
        576:{items: a.data('items-sm'),},
		768:{items: a.data('items-md'),},
        992:{items: a.data('items-lg'),}
        }
    });
});


/*------------------------
   tooltips
-------------------------- */
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})

/*---------------------------------------------------
   Scroll to top
----------------------------------------------------- */
$(function () {
		$(window).on('scroll', function(){
			if ($(this).scrollTop() > 150) {
				$('#back-to-top').fadeIn();
			} else {
				$('#back-to-top').fadeOut();
			}
		});
		});
$('#back-to-top').on("click", function() {
	$('html, body').animate({scrollTop:0}, 'slow');
	return false;
});


$('.smooth-scroll a').on("click", function() {
    var sectionTo = $(this).attr('href');
    $('html, body').animate({
      scrollTop: $(sectionTo).offset().top - 50}, 600);
});


})(jQuery);