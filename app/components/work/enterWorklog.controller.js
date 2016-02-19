(function () {
    'use strict';

    angular.module('worklogApp')
        .controller('EnterWorklogController', EnterWorklogController);

    EnterWorklogController.$inject = ['intervalBackupService', '$scope', 'worklogDBService', '$q', 'uiService', 'translationService', 'extendedFriendlyTextFilter', 'hotkeys', 'jiraService'];

    function EnterWorklogController(intervalBackupService, $scope, worklogDBService, $q, uiService, translationService, extendedFriendlyTextFilter, hotkeys, jiraService) {
        var constants = {
            ERROR: 'ERROR_',
            NOT_SENT: 'NOT_SENT',
            SENT: 'SENT'
        };

        var lastRev = '';
        var vm = this;
        vm.worklogs = [];
        vm.errors = [];
        vm.addWorklog = addWorklog;
        vm.sendToJIRA = sendToJIRA;
        vm.deleteEntry = deleteEntry;
        vm.saveLoginData = saveLoginData;
        vm.clearLoginData = clearLoginData;
        vm.subtractDay = subtractDay;
        vm.addDay = addDay;
        vm.today = today;
        vm.confirmDelete = confirmDelete;
        vm.getLoggedTime = getLoggedTime;
        vm.getOfficeTime = getOfficeTime;
        vm.getSuggestions = getSuggestions;
        vm.selectedObject = selectedObject;
        vm.inputChanged = inputChanged;
        vm.jiraURL = 'http://jira.tierconnect.com';

        vm.username = 'mmayori';
        vm.password = 'M1@y0r!2015';
        vm.date = new Date();
        var loadedDate = new Date();
        vm.logged = false;

        /* Hotkeys Configuration */
        hotkeys.bindTo($scope)
            .add({
                combo: 'f12',
                description: 'Show Dev Tools',
                callback: function() {
                    showConsole();
                }
            });

        /* Watch function, this will watch vm.date (variable in the view is called 'enterWorklogCtrl' */
        $scope.$watch('enterWorklogCtrl.date', function (newValue, oldValue) {
            if(isAValidDate(newValue) && (newValue.getTime() !== loadedDate.getTime())){

                saveStatus(angular.copy(loadedDate), angular.copy(vm.worklogs));

                worklogDBService.getWorklog(newValue).then(function (data) {

                    $scope.$broadcast('angucomplete-alt:clearInput');
                    if (data) {
                        vm.worklogs = data.worklogs;
                        lastRev = data._rev;
                        reloadIssueKeys();
                    } else {
                        vm.worklogs = [];
                        addWorklog();
                    }

                    loadedDate = newValue;

                });

            }
        }, null);

        /* Worklog object template*/
        var currentTIME = getCurrentTime();
        var emptyWorklog = {
            startTime: currentTIME,
            endTime: '',
            description: '',
            issueKey: '',
            worklogId: null,
            status: constants.NOT_SENT
        };

        initialization();

        /**
         * Function that initializes the app gui, load the current status of the application and initializes window close listener
         */
        function initialization() {
            var gui = require('nw.gui');
            var win = gui.Window.get();
            win.title = 'Easy Worklog';

            // Listen to the close event
            win.on('close', function () {
                var windows = this;
                saveStatus(loadedDate, vm.worklogs).then(function () {
                    windows.close(true);
                });
            });

            loadStatus().then(function (){
                intervalBackupService.init(function () {
                    saveStatus(loadedDate, vm.worklogs);
                });
            });
        }

        /**
         * This function shows the user the developer tools window.
         */
        function showConsole() {
            var gui = require('nw.gui');
            var win = gui.Window.get();

            win.showDevTools();
        }

        /**
         * This function removes from the worklog array the selected index.
         * @param index
         */
        function deleteEntry(index) {
            vm.worklogs.splice(index, 1);
            if (vm.worklogs.length === 0) {
                addWorklog();
                $scope.$broadcast('angucomplete-alt:clearInput');
            }
            reloadIssueKeys();

            /*Save the worklogs on deleteEntry*/
            saveStatus(loadedDate, vm.worklogs);
        }

        /**
         * This function reload the value of the autocomplete value.
         */
        function reloadIssueKeys () {
            for (var i=0; i < vm.worklogs.length; i++) {
                $scope.$broadcast('angucomplete-alt:changeInput', 'issue-autocomplete-' + i, { key: vm.worklogs[i].issueKey, summary :  vm.worklogs[i].issueDescription});
            }
        }

        /**
         * This function loads user's login and worklog information every time the application starts.
         * @returns {*}
         */
        function loadStatus() {
            var login = worklogDBService.getLoginData();
            var worklog = worklogDBService.getWorklog(vm.date);

            login = login.then(function (data) {
                if (data) {
                    vm.username = data.username;
                    vm.password = data.password;
                    vm.jiraURL = data.jiraURL;
                    vm.logged = true;
                }
            });

            worklog = worklog.then(function (data) {
                if (data) {
                    vm.worklogs = data.worklogs;
                    lastRev = data._rev;
                    if (vm.worklogs.length === 0) {
                        addWorklog();
                    }
                } else {
                    addWorklog();
                }
                loadedDate = vm.date;
            });

            /* Wait for all promises to be finished in order to return the information*/
            return $q.all([login, worklog]);
        }

        /**
         * This function removes from the database the user's login information.
         */
        function clearLoginData() {
            worklogDBService.deleteLoginData().then(function () {
                vm.username = '';
                vm.password = '';
                vm.logged = false;
            }).catch(function (err) {
                console.log('Error deleting login data: ' + err);
            });
        }

        /**
         * This function save the current status of the application in local database.
         * @param date
         * @param worklogs
         * @returns {*}
         */
        function saveStatus(date, worklogs) {
            return worklogDBService.saveWorklog(date, worklogs, true).then(function (newRev) {
                lastRev = newRev;
            });
        }

        /**
         * Function that stores the user login data in local database.
         * @param hidePopoverCallback Function that will be executed after the login information is stored correctly in local database
         * @returns {*}
         */
        function saveLoginData(hidePopoverCallback) {
            if(vm.jiraURL.charAt(vm.jiraURL.length - 1) === '/') {
                vm.jiraURL = vm.jiraURL.slice(0, vm.jiraURL.length - 1);
            }
            var loginInfo = {
                username: vm.username,
                password: vm.password,
                jiraURL: vm.jiraURL
            };

            return worklogDBService.saveLoginData(loginInfo, true).then(function (newRev) {
                vm.logged = true;
                hidePopoverCallback();
            });
        }

        /**
         * This functions return the suggestions of a given issueKey.
         * @param issueKey
         * @returns {*}
         */
        function getSuggestions(issueKey){
            return jiraService.getSuggestions(issueKey);
        }

        /**
         * This function is a callback to selected-object attr of angucomplete-alt to set issueKey.
         * @param selectedObj
         */
        function selectedObject(selectedObj) {
            if (selectedObj){
                /*Fix --> If summaryText field is not set, get the summary field*/
                vm.worklogs[this.$parent.$index].issueDescription = selectedObj.originalObject.summaryText || selectedObj.originalObject.summary;
                vm.worklogs[this.$parent.$index].issueKey = selectedObj.originalObject.key;
            }
        }

        /**
         * This function is a callback to input-changed attr of angucomplete-alt to set issueKey, this function fires when the user start writing on the input element.
         * @param str
         */
        function inputChanged(str) {
            if (vm.worklogs[this.$parent.$index].issueDescription !== '') {
                vm.worklogs[this.$parent.$index].issueDescription = '';
            }
            vm.worklogs[this.$parent.$index].issueKey = (str ? str : '');
        }

        /**
         * This function creates a new empty worklog and adds it to the worklog array.
         */
        function addWorklog() {
            var worklogToAdd = angular.copy(emptyWorklog);

            /*Get current time*/
            var currentTime =  getCurrentTime();

            /* We use angular.copy because the directive we're using somehow seems to be converting a date string into an object.
             If we use a simple value assignation we'll copy a reference to this object causing repeated values when this property is changed */

            /* If exists a previous worklog take the end time of this one as the initial time of the new worklog entry. */
            if (vm.worklogs.length > 0) {
                var lastWorklog = vm.worklogs[vm.worklogs.length - 1];
                /*If the lastWorklog.endTime is not set to undefined, then get the time and normalized the date*/
                if (lastWorklog.endTime !== undefined) {
                    var normalizedLastWorklogDate = normalizeDate(lastWorklog.endTime);
                    /*If is not a valid date, set the lastWorklog.endTime and the worklog.startTime to the currentTime, rounded to 5 min*/
                    if (!isAValidDate(normalizedLastWorklogDate)) {
                        lastWorklog.endTime = angular.copy(normalizeDate(roundCurrentTime(currentTime, 5)._d)._i);
                        worklogToAdd.startTime = angular.copy(lastWorklog.endTime);
                    } else {
                        /*If is a valid date, set the worklogToAdd.startTime, to the normalized lastWorklog.endTime*/
                        worklogToAdd.startTime = angular.copy(normalizedLastWorklogDate._i);
                    }
                } else {
                    /*If the lastWorklog.endTime is empty, set the lastWorklog.endTime and worklogToAdd.startTime to the currenTime*/
                    lastWorklog.endTime = angular.copy(normalizeDate(roundCurrentTime(currentTime, 5)._d)._i);
                    worklogToAdd.startTime = angular.copy(lastWorklog.endTime);
                }
            }
            vm.worklogs.push(worklogToAdd);

            /*Save status on addWorklog call*/
            saveStatus(loadedDate, vm.worklogs);
        }

        /**
         * This function create a Moment object from the date passed by param, with the format ['1970-01-01T'+hour+'.000Z].
         * @param dateToNormalize
         * @returns {*}
         */
        function normalizeDate (dateToNormalize) {
            /*If dateToNormalize is not a Moment object*/
            if (!dateToNormalize.hasOwnProperty('_isAMomentObject')) {
                /*Get the hour from the dateToNormalize and return the object created*/
                var hour = dateToNormalize.toString().split(' ')[4];
                return (hour ? moment('1970-01-01T'+hour+'.000Z') : moment(dateToNormalize))
            }
            return dateToNormalize;
        }

        /**
         * This function return the current time in the format 1970-01-01T08:00:00.000Z
         * @returns {string}
         */
        function getCurrentTime () {
            return '1970-01-01T'+moment().format('HH:mm')+':00.000Z';
        }

        /**
         * This function check if the date passed by param is a valid date
         * @param str
         * @returns {boolean}
         */
        function isAValidDate (str) {
            return moment(str, 'YYYY-MM-DDTHH:mm:ss.000Z').isValid() || moment(str, 'ddd MMM DD YYYY HH:mm:ss GMT+0000 (GMT Standard Time)').isValid();
        }

        /**
         * This function return the current time rounded to the next 5 minutes.
         * @param timeToRound
         * @returns {string}
         */
        function roundCurrentTime(date, interval) {
            var currentMoment =normalizeDate(date);
            var min = currentMoment.minutes();
            return currentMoment.add(((min+interval) > 59 ? (60 - min) : (interval - ((min+interval) % interval))), 'minutes');
        }

        /**
         * Add a day to the date store in vm.date variable
         */
        function addDay() {
            var date = new Date(vm.date);
            date.setDate(date.getDate() + 1);
            vm.date = date;
        }

        /**
         * Subtract a day to the date store in vm.date variable
         */
        function subtractDay() {
            var date = new Date(vm.date);
            date.setDate(date.getDate() - 1);
            vm.date = date;
        }

        /**
         * Reset the date store in vm.date variable to the current date. Before changing the date check if we are already
         * in today's date.
         */
        function today(){
            /*If the date input is empty or is an Invalid Date, set the vm.date to the current date*/
            if (!vm.date || vm.date === 'Invalid Date') {
                vm.date = new Date();
            }
            var storedDate = vm.date.toISOString().slice(0, 10);
            var currentDate = new Date().toISOString().slice(0, 10);
            if(storedDate !== currentDate){
                vm.date = new Date();
            }
        }

        /**
         * Function that shows a confirmation screen where the user can confirm that wants to delete the selected worklog entry.
         * @param index The index of the selected worklog entry.
         */
        function confirmDelete(index){
            if(vm.worklogs[index].worklogId) {
                uiService.showConfirmScreen(
                    'Alert!',
                    'This will delete the entry #'+(index+1)+' from JIRA, do you want to continue?',
                    function(){
                        deleteFromJIRA(index);
                    },
                    angular.noop());
            }else{
                if (isAnyPropertyFilled(vm.worklogs[index], ["description", "issueKey"])) {
                    uiService.showConfirmScreen(
                        'Warning!',
                        'There is data entered on line #'+(index+1)+'. Are you sure you want to delete this line?',
                        function(){
                            deleteEntry(index);
                        },
                        angular.noop());
                } else {
                    deleteEntry(index);
                }
            }
        }

        /**
         * Function that tell us if a property specified in the array, is filled.
         * @param worklog
         * @param properties
         * @returns {boolean}
         */
        function isAnyPropertyFilled (worklog, properties) {
            for (var i=0; i < properties.length; i++) {
                if (!_.isEmpty(worklog[properties[i]])) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Send current worklog information to JIRA using user's login data.
         */
        function sendToJIRA(formErrors) {
            if (validation(formErrors)) {
                uiService.showLoadingScreen('Sending information to JIRA', '');

                var requests = [];

                vm.worklogs.forEach(function (worklog) {
                    if (worklog.status !== constants.SENT) {
                       requests.push(sendWorklog(worklog));
                    }
                });

                $q.all(requests).then(function () {
                    uiService.hideLoadingScreen();
                }).catch(function (error) {
                    vm.errors.push(extendedFriendlyTextFilter(error));
                    uiService.hideLoadingScreen();
                });
            }

        }

        /**
         * Delete the selected entry from JIRA and internal database.
         * @param index The index of the selected worklog entry
         */
        function deleteFromJIRA(index) {
            var worklogEntry = vm.worklogs[index];

            jiraService.deleteWorklog(worklogEntry).then(function(response){
                if(response.statusCode === 204){
                    deleteEntry(index);
                }else if (response.statusCode === 404){
                    uiService.showConfirmScreen(
                        'Alert!',
                        'The worklog entry you want to delete has not been found, do you want to delete it locally?',
                        function(){
                            deleteEntry(index);
                        },
                        angular.noop());
                    worklogEntry.status = constants.ERROR + response.statusCode;
                }else{
                    worklogEntry.status = constants.ERROR + response.statusCode;
                }
            });
        }

        /**
         * This function checks if all the stored worklog entries are valid.
         * @returns {boolean}
         */
        function worklogsDurationAreValid() {
            var formIsValid = true;
            vm.worklogs.forEach(function (worklog, index) {
                if(worklog.startTime !== undefined && worklog.endTime !== undefined){
                    var duration = moment.duration(moment(worklog.endTime).diff(moment(worklog.startTime)));
                    var lineNumber = index + 1;
                    if (duration === 0) {
                        vm.errors.push('There\'s an error on line ' + lineNumber + '. Start time and end time can\'t be the same.');
                        formIsValid = false;
                    } else {
                        if (duration < 0) {
                            vm.errors.push('There\'s an error on line ' + lineNumber + '. Start time can\'t be greater than end time');
                            formIsValid = false;
                        }
                    }
                }
            });

            return formIsValid;
        }

        /**
         * This function checks if some of the worklog entries overlaps with each other.
         * @returns {boolean}
         */
        function worklogsTimesDontOverlap() {
            var formIsValid = true;
            vm.worklogs.forEach(function (worklog, index) {
                if(worklog.startTime !== undefined && worklog.endTime !== undefined) {
                    var currentWorklogRange = moment.range(moment(worklog.startTime), moment(worklog.endTime));
                    var currentWorklogIndex = index + 1;
                    for(var i = index + 1; i < vm.worklogs.length; i++){

                        var duration = moment.duration(moment(vm.worklogs[i].endTime).diff(moment(vm.worklogs[i].startTime))).asMinutes();

                        if(duration > 0 && ((vm.worklogs[i].startTime !== undefined) && (vm.worklogs[i].endTime !== undefined))){
                            var nextWorklogRange = moment.range(moment(vm.worklogs[i].startTime), moment(vm.worklogs[i].endTime));
                            var nextWorklogIndex = i + 1;

                            if(currentWorklogRange.overlaps(nextWorklogRange) ){
                                vm.errors.push('Line ' + currentWorklogIndex + ' overlaps with line ' + nextWorklogIndex + '. Please check range values.');
                                formIsValid = false;
                            }
                        }

                    }
                }

            });
            return formIsValid;
        }

        /**
         * This function validates if all required fields have been filled by the user.
         * @param formErrors Object that contains all errors associated with worklog form.
         * @returns {boolean} Returns true if there are no errors, in other case return false
         */
        function allRequiredFieldsAreFilled(formErrors) {
            if(formErrors.hasOwnProperty('required')){
                formErrors.required.forEach(function (element) {
                    var field = element.$name.split('-')[0];
                    var line = element.$name.split('-')[1];
                    vm.errors.push('The field ' + translationService.translate(field) + ' on line ' + line + ' is required. Please fill it before sending your worklog.');
                });

                return false;
            }
            return true;
        }
        /**
         * Function that validates all entries stored in the vm.worklogs object before sending worklog to JIRA
         * @returns {boolean} Returns true if all entries are valid, false in other case.
         */
        function validation(formErrors) {
            vm.errors = [];
            var allFieldsHaveBeenFilled = allRequiredFieldsAreFilled(formErrors);
            var durationIsValid = worklogsDurationAreValid();
            var timesDontOverlap = worklogsTimesDontOverlap();
            return allFieldsHaveBeenFilled && durationIsValid && timesDontOverlap;
        }

        /**
         * Send to JIRA a worklog object to be added to the user's worklog history.
         * @param worklog   The worklog object that is going to be send to JIRA
         */
        function sendWorklog(worklog) {
            var defer = $q.defer();

            jiraService.sendWorklog(worklog, loadedDate).then(function(worklogId){
                worklog.status = constants.SENT;
                worklog.worklogId = worklogId;
                defer.resolve(worklogId);
            }, function(errorCode){
                worklog.status = constants.ERROR + errorCode;
                defer.reject(constants.ERROR + errorCode);
            });

            return defer.promise;
        }

        /**
         * This function calculates how much time the user is going to log in minutes.
         * @returns {number}
         */
        function getLoggedTime() {

            var total = 0;
            vm.worklogs.forEach(function (worklog) {
                var duration = moment.duration(moment(worklog.endTime ? worklog.endTime : 0).diff(moment(worklog.startTime ? worklog.startTime : 0)));
                var minutes = duration.asMinutes();
                if(minutes < 0){
                    minutes = 0;
                }
                total += minutes;
            });

            return total;
        }

        /**
         * This function calculates how much time the user has been in the office and returns it in minutes.
         * @returns {*}
         */
        function getOfficeTime() {
            var arrayStartTime = [];
            var arrayEndTime = [];
            vm.worklogs.forEach(function (worklog) {
                arrayStartTime.push(new Date(worklog.startTime).getTime());
                arrayEndTime.push(new Date(worklog.endTime).getTime());
            });
            var minDate = new Date(Math.min.apply(null, arrayStartTime));
            var maxDate = new Date(Math.max.apply(null, arrayEndTime));
            var duration = moment.duration(moment(maxDate).diff(moment(minDate)));
            var minutes = duration.asMinutes();

            return minutes;
        }
    }

})();