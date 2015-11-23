(function() {
  'use strict';

  var root = this;
  var fxosRate;
  if (typeof exports !== 'undefined') {
    fxosRate = exports;
  } else {
    fxosRate = root.fxosRate = {};
  }

  var DEFAULTS = {
    daysUntilPrompt: 0,
    usesUntilPrompt: 0,
    eventsUntilPrompt: 0,
    usesPerWeekForPrompt: 0,
    eventsPerWeekForPrompt: 0,
    remindPeriod: 0
  };
  var optArgsNames = [
    'daysUntilPrompt',
    'usesUntilPrompt',
    'eventsUntilPrompt',
    'usesPerWeekForPrompt',
    'eventsPerWeekForPrompt',
    'remindPeriod'
  ];
  var optArgsOffset = 2;

  fxosRate.init = function(applicationName, applicationVersion, config) {

    var optArgs = Array.prototype.slice.call(arguments, optArgsOffset);

    // Fallback to keep compatibility
    if (arguments.length > optArgsOffset && typeof config !== 'object') {
      config = {};
      optArgsNames.forEach(function (argumentName, index) {
        config[argumentName] = optArgs[index];
      });
    }

    // Set defaults
    config = config || {};
    for (var key in DEFAULTS) {
      if (!config.hasOwnProperty(key) || typeof config[key] === 'undefined') {
        config[key] = DEFAULTS[key]
      }
    }

    this.applicationName = applicationName;
    this.applicationVersion = applicationVersion;

    this.daysUntilPrompt = config.daysUntilPrompt;
    this.usesUntilPrompt = config.usesUntilPrompt;
    this.eventsUntilPrompt = config.eventsUntilPrompt;
    this.usesPerWeekForPrompt = config.usesPerWeekForPrompt;
    this.eventsPerWeekForPrompt = config.eventsPerWeekForPrompt;
    this.remindPeriod = config.remindPeriod;

    this.MILLISPERDAY = 86400000;
    this.MARKETBASEURL = 'https://marketplace.firefox.com/app/';

    // Init LocalStorage if no initialized
    this.usesWeek = this.getLsItem('usesWeek') || 0;
    this.setLsItem('usesWeek', parseInt(this.usesWeek) + 1);

    this.eventsWeek = this.getLsItem('eventsWeek') || 0;
    this.setLsItem('eventsWeek', this.eventsWeek);

    this.events = this.getLsItem('events') || 0;
    this.setLsItem('events', this.events);

    this.usedTimes = this.getLsItem('usedTimes') || 0;
    this.usedTimes++;
    this.setLsItem('usedTimes', this.usedTimes);

    this.prompted = this.getLsItem('prompted') || "no";
    this.setLsItem('prompted', this.prompted);

    this.firstUsageDate = this.getLsItem('firstUsageDate') || new Date();
    this.setLsItem('firstUsageDate', this.firstUsageDate);
    console.log("FUD " + this.firstUsageDate);

    this.rateRejected = this.getLsItem('rateRejected') || "no";
    this.setLsItem('rateRejected', this.rateRejected);

    this.alreadyRated = this.getLsItem('alreadyRated') || "no";
    this.setLsItem('alreadyRated', this.alreadyRated);

    this.promptDate = this.getLsItem('promtDate') || null;
    this.setLsItem('promptDate', this.promptDate);
    this.weekStartDate = this.getLsItem('promtDate') || null;
    this.setLsItem('weekStartDate', this.weekStartDate);

    this.checkWeekPeriod();
  };

  fxosRate.getLsItem = function(itemName) {
    return localStorage.getItem(this.applicationName + '-' + itemName);
  };

  fxosRate.setLsItem = function(itemName, itemValue) {
    localStorage.setItem(this.applicationName + '-' + itemName, itemValue);
  };

  // Checks if a prompt for rating the app should be done at this moment
  // based on the initiailization criteria
  fxosRate.promptRequired = function() {
    if (this.shouldPrompt()) {
      this.prompt();
    }
  };

  fxosRate.shouldPrompt = function() {
    var prompt = false;
    // Checks if a prompt for rating should be done
    if (this.rateRejected === 'yes') {
      console.log('User rejected rating');
    } else if (this.alreadyRated === 'yes') {
      console.log('App already rated');
    } else if (!this.minimumUsageMet()) { // DONE
      console.log('App has not been yet used enough');
    } else if (!this.notRemindPeriodOver()) { // DONE
      console.log('Not remind period is not over yet');
    } else if (!this.weeklyUsageReached()) {// DONE
      console.log('Not enough usage per week');
    } else {
      prompt = true;
    }
    return prompt;
  };

  // Check if the app has been used enough to request user to rate it
  // enough means number of times launched or days since first launch
  fxosRate.minimumUsageMet = function() {
    var usedEnough = false;

    var now = new Date();
    var days = Math.round(
      (now.getTime() - (new Date(this.firstUsageDate)).getTime()) /
      this.MILLISPERDAY);
      console.log("DAYS " + days)

    if ((this.usedTimes > this.usesUntilPrompt) &&
        (days >= this.daysUntilPrompt) &&
        (this.events >= this.eventsUntilPrompt)) {
      usedEnough = true;
    }
    return usedEnough;
  };

  // If the user has selected to be reminded later on, we need to honour this
  // period before doing so - returns true if 'not remind period' is over
  fxosRate.notRemindPeriodOver = function() {
    var over = true;
    // otherwise it never was prompted before
    if (this.prompted === 'yes') {
      var now = new Date();
      var days = Math.round(
        (now.getTime() - this.promptDate) / this.MILLISPERDAY);
      console.log(days);
      if (days < this.remindPeriod) {
        over = false;
      }
    }
    return over;
  };

  // In order to avoid prompting if usage is low, we can set some boundaries
  // per usage week based on a given event (pushed by app in logEvent) or
  // in number of app launches
  // return true if user has not ever been prompted yet
  fxosRate.weeklyUsageReached = function() {
    var reached = false;
    if (this.prompted === 'no') {
      reached = true;
    } else if ((this.usesWeek > this.usesPerWeekForPrompt) &&
      (this.eventsWeek >= this.eventsPerWeekForPrompt)) {
      reached = true;
    }
    return reached;
  };

  // Used to logEvents so that apps can decide to ask for rating based on a
  // a given amount of events rather than in number of launches, e.g. number
  // of messages sent. After invoking this method, developer needs to invoke
  // promptRequired to determine if user should be prompted or not
  fxosRate.logEvent = function(events) {
    this.checkWeekPeriod();
    this.eventsWeek += events;
    this.events += events;

    this.setLsItem('eventsWeek', this.eventsWeek);
    this.setLsItem('events', this.events);
  };

  // Helper function to check if a week has already passed so that we need
  // to reset counters for weekly control
  fxosRate.checkWeekPeriod = function() {
    if (this.weekStartDate !== null) {
      var now = new Date();
      var days = Math.round((now.getTime() -
        this.weekStartDate.getTime()) / this.MILLISPERDAY);
      if (days > 7) { // If more than 1 week has passed, it's time to reset
        this.setLsItem('weekStartDate', now);
        this.weekStartDate = now;
        this.setLsItem('usesWeek', 0);
        this.usesWeek = 0;
        this.setLsItem('eventsWeek', 0);
        this.eventsWeek = 0;
      }
    }
  };

  // Shows the prompt to the user
  fxosRate.prompt = function() {
    this.promptDate = new Date();
    this.weekStartDate = new Date();
    this.setLsItem('promptDate', this.promptDate);
    this.setLsItem('weekStartDate', this.weekStartDate);

    this.setLsItem('prompted', 'yes');
    this.setLsItem('eventsWeek', 0);
    this.setLsItem('usesWeek', 0);
    this.usesWeek = 0;
    this.eventsWeek = 0;
    this.prompted = 'yes';

    var rateIt = window.confirm(navigator.mozL10n.get('wanttorate'));
    if (rateIt === true) {
      this.setLsItem('alreadyRated', 'yes');
      this.alreadyRated = "yes";
      if (window.MozActivity) {
        var activity = new MozActivity({
          name: "marketplace-app-rating",
          data: {slug: this.applicationName}
        });
        activity.onerror = function() {
          window.open(this.MARKETBASEURL + this.applicationName + '/ratings/add');
        };
      } else {
        window.open(this.MARKETBASEURL + this.applicationName + '/ratings/add');
      }
    } else {
      var later = window.confirm(navigator.mozL10n.get('wantremindlater'));
      if (later !== true) {
        this.setLsItem('rateRejected', 'yes');
        this.rateRejected = "yes";
      }
    }
  };

  // only for testing purposes
  fxosRate.clear = function() {
    this.firstUsageDate = new Date();
    this.setLsItem('usesWeek', 0);
    this.setLsItem('usedTimes', 0);
    this.setLsItem('firstUsageDate', this.firstUsageDate); 
    this.setLsItem('eventsWeek', 0);
    this.setLsItem('events', 0);
    this.setLsItem('weekStartDate', null);
    this.setLsItem('promptDate', null);
    this.setLsItem('prompted', 'no');
    this.setLsItem('alreadyRated', 'no');
    this.setLsItem('rateRejected', 'no');
    this.usesWeek = 0;
    this.eventsWeek = 0;
    this.events = 0;
    this.usedTimes = 0;
    this.prompted = 'no';
    this.rateRejected = 'no';
    this.alreadyRated = 'no';
    this.promptDate = null;
    this.weekStartDate = null;
  };

  return this;

}).call(this);
