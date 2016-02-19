/*
 * Service to handle part of the user interface. For instance: loading screen
 */
(function () {
  
    'use strict';
    angular.module('worklogApp')
        .factory('uiService', uiService);

    uiService.$inject = ['$modal', '$rootScope', '$sce'];

    function uiService($modal, $rootScope, $sce) {
        // We create a new isolated Scope for the loading screen
        var loadingScreenScope = $rootScope.$new(true);
        var loadingScreen = $modal({
            template: 'app/shared/templates/loading.template.html',
            show: false,
            scope: loadingScreenScope,
            backdrop: 'static'
        });

        var uiServiceResult = {
            showLoadingScreen: showLoadingScreen,
            hideLoadingScreen: hideLoadingScreen,
            updateLoadingScreen: updateLoadingScreen,
            updateLoadingScreenProgress: updateLoadingScreenProgress,
            loadingScreenProgressComplete: loadingScreenProgressComplete,
            showConfirmScreen: showConfirmScreen
        };

        initialization();

        return uiServiceResult;

        ///////////////////////

        function initialization(){
            // prepare scopes for "shared/globals" screens
            loadingScreenScope.showShadow = true;
        }

        /**
         * Shows a loading screen with a title and a content
         * Example usage: showLoadingScreen('Loading','Loading please wait...')
         *
         * @param title the title of this modal screen
         * @param content the message to show to the user
         */
        function showLoadingScreen(title, content) {
            showLoadingScreenWithProgress(title, content, null);
        }

        /**
         * Shows a loading screen with a title and a content and the progress in percentage
         * Example usage: showLoadingScreen('Loading','Loading please wait... (40%)')
         *
         * @param title the title of this modal screen
         * @param content the message to show to the user
         * @param percentage of the progress
         */
        function showLoadingScreenWithProgress(title, content, percentage) {
            loadingScreenScope.loadingTitle = title;
            loadingScreenScope.loadingContent = content;
            loadingScreenScope.loadingPercentage = percentage;
            loadingScreen.$promise.then(loadingScreen.show);
        }


        /**
         * Hides the loading Screen
         */
        function hideLoadingScreen(){
            loadingScreen.$promise.then(loadingScreen.hide);
        }

        /**
         * Updates the content (text) of the loading screen.
         * @param content Content Text
         */
        function updateLoadingScreen(content){
            loadingScreenScope.loadingContent = content;
        }

        /**
         * Updates the content (text) of the loading screen with a percentage at the end.
         * @param percentage Percentage to be appended
         */
        function updateLoadingScreenProgress(percentage){
            loadingScreenScope.loadingPercentage = percentage;
        }

        /**
         * Hides the progress, since its complete.
         */
        function loadingScreenProgressComplete() {
            loadingScreenScope.loadingPercentage = null;
        }

        /**
         * Shows an Alert Screen, it contains:
         * - a title
         * - a message
         * - a button (to close the dialog)
         * - a priority (z-index order on UI).

         * Example usage: showAlertScreen('Title','Message - content', function (){})
         *
         * @param title the title of this modal screen
         * @param content the message to display to the user
         * @param callbackAccept callback that will be called when Ok Button is clicked
         * @param priority integer value with the priority (the higher the more priority it has)
         * @returns the alertScreen created by the $modal service
         */
        function showAlertScreenWithPriority(title, content, callbackAccept, priority) {
            var alertScreenScope = $rootScope.$new(true);
            var alertScreen = $modal({
                template: 'app/shared/templates/alert.template.html',
                scope: alertScreenScope,
                show: true,
                backdrop: 'static',
                showCloseButton: false
            });
            alertScreenScope.showShadow = true;
            alertScreenScope.title = title;
            alertScreenScope.content = content;
            alertScreenScope.close = callbackAccept;
            // Default priority (z-index) => priority "0"
            alertScreenScope.priority = 1500;

            // Determine priority
            if(priority && priority > 0){
                alertScreenScope.priority += priority;
            }

            return alertScreen;
        }


        /**
         * Shows an Alert Screen, it contains a title, a message and a button to close the screen.
         * Example usage: showAlertScreen('Title','Message - content', function (){})
         *
         * @param title the title of this modal screen
         * @param content the message to display to the user
         * @param callbackAccept callback that will be called when Ok Button is clicked
         * @returns the alertScreen created by the $modal service
         */
        function showAlertScreen(title, content, callbackAccept) {
            return showAlertScreenWithPriority(title, content, callbackAccept, 0);
        }

        /**
         * Shows a confirmation screen to the user, it contains a title and a message, it also has two buttons, one to
         * Confirm the action and the other one to cancel it.
         * Example usage: showConfirmScreen('Title','Message - content', function (){}, function (){})
         *
         * @param title the title of this modal screen
         * @param content the message to show to the user
         * @param callbackConfirm Callback that will be called when we confirm the action
         * @param callbackClose Callback that will be called when we close the screen
         * @returns the confirmScreen created by the $modal service
         */
        function showConfirmScreen(title, content, callbackConfirm, callbackClose) {
            var confirmScreenScope = $rootScope.$new(true);
            var confirmScreen = $modal({
                template: 'app/shared/templates/confirm.template.html',
                scope: confirmScreenScope,
                show: true,
                backdrop: 'static'
            });
            confirmScreenScope.showShadow = true;
            confirmScreenScope.title = title;
            confirmScreenScope.content = $sce.trustAsHtml(content);
            confirmScreenScope.confirmAction = callbackConfirm;
            confirmScreenScope.close = callbackClose;

            return confirmScreen;
        }
    }
})();
