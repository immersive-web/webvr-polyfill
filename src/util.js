/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Util = window.Util || {};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.mapRange = function(value, minDomain, maxDomain, minRange, maxRange) {
  // If we're out of range, return an invalid value.
  var percent = (value - minDomain) / (maxDomain - minDomain);
  // Clamp percent to [0, 1].
  percent = Util.clamp(percent, 0, 1);
  return minRange + percent * (maxRange - minRange);
};

module.exports = Util;
