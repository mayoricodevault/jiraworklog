(function () {
    'use strict';

    angular.module('worklogApp')
        .config(configure);

    configure.$inject = ['hotkeysProvider'];

    function configure(hotkeysProvider) {
        hotkeysProvider.template = '<div class="cfp-hotkeys-container fade" ng-class="{in: helpVisible}" style="display: none;"><div class="cfp-hotkeys">' +
            '<h4 class="cfp-hotkeys-title" ng-if="!header">{{ title }}</h4>' +
            '<div ng-bind-html="header" ng-if="header"></div>' +
            '<table><tbody>' +
            '<tr ng-repeat="hotkey in hotkeys | filter:{ description: \'!$$undefined$$\' }">' +
            '<td class="cfp-hotkeys-keys">' +
            '<span ng-repeat="key in hotkey.format() track by $index" class="cfp-hotkeys-key">{{ key }}</span>' +
            '</td>' +
            '<td class="cfp-hotkeys-text">{{ hotkey.description }}</td>' +
            '</tr>' +
            '</tbody></table>' +
            '<div ng-bind-html="footer" ng-if="footer"></div>' +
            '<div class="cfp-hotkeys-close" ng-click="toggleCheatSheet()">&times;</div>' +
            '</div></div>';
    }
})();