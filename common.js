var stg;
window.addEventListener('DOMContentLoaded', function () {
    initCookieBanner();

    function initCookieBanner() {
        var expirationPeriod = 30 * 24 * 60 * 60 * 1000;

        var cookieBanner = document.getElementById('cookie-banner');
        var acceptBtn = document.getElementById('cookie-banner-accept');
        var declineBtn = document.getElementById('cookie-banner-decline');

        acceptBtn.addEventListener('click', onCookieConsentGiven);
        declineBtn.addEventListener('click', onCookieConsentDeclined)

        var storage = new CookieStorageFacade();
        stg = storage;
        if (shouldDisplayBanner()) {
            cookieBanner.style.display = 'flex';
        } else {
            hideBanner();
        }

        function onCookieConsentGiven() {
            storage.accept(expirationPeriod);
            hideBanner();
        }

        function onCookieConsentDeclined() {
            storage.decline(expirationPeriod);
            hideBanner();
        }

        function hideBanner() {
            cookieBanner.style.display = 'none';
        }

        function shouldDisplayBanner() {
            var consent = storage.getConsent();
            if (consent == null) {
                return true;
            }

            if (consent.expiration < Date.now()) {
                storage.removeConsent();
                return true;
            }

            return false;
        }

        function CookieStorageFacade(cookieName) {
            this.useCookie = window.localStorage == null;
            // Beware of semicolons in cookie name
            this.cookieName = cookieName || 'cookieConsentGiven';

            this.accept = function (acceptPeriod) {
                this.setConsent(true, acceptPeriod);
            }
            this.decline = function (declinePeriod) {
                this.setConsent(false, declinePeriod);
            }

            this.setConsent = function (value, expiration) {
                var expirationDate = Date.now() + expiration
                var consent = JSON.stringify({
                    value: value,
                    expiration: expirationDate
                });
                if (this.useCookie) {
                    document.cookie = this.cookieName + "=" + consent + "; expires=" + new Date(expirationDate).toUTCString() + "; path=/";
                } else {
                    localStorage.setItem(this.cookieName, consent);
                }
            }

            this.getConsent = function () {
                if (this.useCookie) {
                    var nameEQ = this.cookieName + "=";
                    var ca = document.cookie.split(';');
                    for (var i = 0; i < ca.length; i++) {
                        var c = ca[i];
                        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                        if (c.indexOf(nameEQ) == 0) return JSON.parse(c.substring(nameEQ.length, c.length));
                    }
                    return null;

                } else {
                    return JSON.parse(localStorage.getItem(this.cookieName));
                }
            }

            this.removeConsent = function () {
                if (this.useCookie) {
                    document.cookie = this.cookieName + '=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                } else {
                    localStorage.removeItem(this.cookieName);
                }
            }
        }
    }
});
