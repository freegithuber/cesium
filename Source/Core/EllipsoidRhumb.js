define([
        './Cartesian3',
        './Cartographic',
        './Check',
        './defaultValue',
        './defined',
        './defineProperties',
        './Ellipsoid',
        './Math'
    ], function(
        Cartesian3,
        Cartographic,
        Check,
        defaultValue,
        defined,
        defineProperties,
        Ellipsoid,
        CesiumMath) {
    'use strict';

    function calculateM(ellipticity, major, latitude) {
        if (ellipticity === 0.0) { // sphere
            return major * latitude;
        }

        var e2 = ellipticity * ellipticity;
        var e4 = e2 * e2;
        var e6 = e4 * e2;
        var e8 = e6 * e2;
        var e10 = e8 * e2;
        var e12 = e10 * e2;
        var phi = latitude;
        var sin2Phi = Math.sin(2 * phi);
        var sin4Phi = Math.sin(4 * phi);
        var sin6Phi = Math.sin(6 * phi);
        var sin8Phi = Math.sin(8 * phi);
        var sin10Phi = Math.sin(10 * phi);
        var sin12Phi = Math.sin(12 * phi);

        return major * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256 - 175 * e8 / 16384 - 441 * e10 / 65536 - 4851 * e12 / 1048576) * phi
                     - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024 + 105 * e8 / 4096 + 2205 * e10 / 131072 + 6237 * e12 / 524288) * sin2Phi
                     + (15 * e4 / 256 + 45 * e6 / 1024 + 525 * e8 / 16384 + 1575 * e10 / 65536 + 155925 * e12 / 8388608) * sin4Phi
                     - (35 * e6 / 3072 + 175 * e8 / 12288 + 3675 * e10 / 262144 + 13475 * e12 / 1048576) * sin6Phi
                     + (315 * e8 / 131072 + 2205 * e10 / 524288 + 43659 * e12 / 8388608) * sin8Phi
                     - (693 * e10 / 1310720 + 6237 * e12 / 5242880) * sin10Phi
                     + 1001 * e12 / 8388608 * sin12Phi);
    }

    function calculateInverseM(M, ellipticity, major) {
        var d = M / major;

        if (ellipticity === 0.0) { // sphere
            return d;
        }

        var d2 = d * d;
        var d3 = d2 * d;
        var d4 = d3 * d;
        var e = ellipticity;
        var e2 = e * e;
        var e4 = e2 * e2;
        var e6 = e4 * e2;
        var e8 = e6 * e2;
        var e10 = e8 * e2;
        var e12 = e10 * e2;
        var sin2D = Math.sin(2 * d);
        var cos2D = Math.cos(2 * d);
        var sin4D = Math.sin(4 * d);
        var cos4D = Math.cos(4 * d);
        var sin6D = Math.sin(6 * d);
        var cos6D = Math.cos(6 * d);
        var sin8D = Math.sin(8 * d);
        var cos8D = Math.cos(8 * d);
        var sin10D = Math.sin(10 * d);
        var cos10D = Math.cos(10 * d);
        var sin12D = Math.sin(12 * d);

        return d + d * e2 / 4 + 7 * d * e4 / 64 + 15 * d * e6 / 256 + 579 * d * e8 / 16384 + 1515 * d * e10 / 65536 + 16837 * d * e12 / 1048576
            + (3 * d * e4 / 16 + 45 * d * e6 / 256 - d * (32 * d2 - 561) * e8 / 4096 - d * (232 * d2 - 1677) * e10 / 16384 + d * (399985 - 90560 * d2 + 512 * d4) * e12 / 5242880) * cos2D
            + (21 * d * e6 / 256 + 483 * d * e8 / 4096 - d * (224 * d2 - 1969) * e10 / 16384 - d * (33152 * d2 - 112599) * e12 / 1048576) * cos4D
            + (151 * d * e8 / 4096 + 4681 * d * e10 / 65536 + 1479 * d * e12 / 16384 - 453 * d3 * e12 / 32768) * cos6D
            + (1097 * d * e10 / 65536 + 42783 * d * e12 / 1048576) * cos8D
            + 8011 * d * e12 / 1048576 * cos10D
            + (3 * e2 / 8 + 3 * e4 / 16 + 213 * e6 / 2048 - 3 * d2 * e6 / 64 + 255 * e8 / 4096 - 33 * d2 * e8 / 512 + 20861 * e10 / 524288 - 33 * d2 * e10 / 512 + d4 * e10 / 1024 + 28273 * e12 / 1048576 - 471 * d2 * e12 / 8192 + 9 * d4 * e12 / 4096) * sin2D
            + (21 * e4 / 256 + 21 * e6 / 256 + 533 * e8 / 8192 - 21 * d2 * e8 / 512 + 197 * e10 / 4096 - 315 * d2 * e10 / 4096 + 584039 * e12 / 16777216 - 12517 * d2 * e12 / 131072 + 7 * d4 * e12 / 2048) * sin4D
            + (151 * e6 / 6144 + 151 * e8 / 4096 + 5019 * e10 / 131072 - 453 * d2 * e10 / 16384 + 26965 * e12 / 786432 - 8607 * d2 * e12 / 131072) * sin6D
            + (1097 * e8 / 131072 + 1097 * e10 / 65536 + 225797 * e12 / 10485760 - 1097 * d2 * e12 / 65536) * sin8D
            + (8011 * e10 / 2621440 + 8011 * e12 / 1048576) * sin10D
            + 293393 * e12 / 251658240 * sin12D;
    }

    function calculateSigma(ellipticity, latitude) {
        if (ellipticity === 0.0) { // sphere
            return Math.log(Math.tan(0.5 * (CesiumMath.PI_OVER_TWO + latitude)));
        }

        var eSinL = ellipticity * Math.sin(latitude);
        return Math.log(Math.tan(0.5 * (CesiumMath.PI_OVER_TWO + latitude))) - (ellipticity / 2.0 * Math.log((1 + eSinL) / (1 - eSinL)));
    }

    function calculateHeading(ellipsoidRhumb, major, minor, firstLongitude, firstLatitude, secondLongitude, secondLatitude) {
        var sigma1 = calculateSigma(ellipsoidRhumb._ellipticity, firstLatitude);
        var sigma2 = calculateSigma(ellipsoidRhumb._ellipticity, secondLatitude);
        return Math.atan2(CesiumMath.negativePiToPi(secondLongitude - firstLongitude), sigma2 - sigma1);
    }

    function calculateArcLength(ellipsoidRhumb, major, minor, firstLongitude, firstLatitude, secondLongitude, secondLatitude) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('heading', ellipsoidRhumb._heading);
        //>>includeEnd('debug');

        var heading = ellipsoidRhumb._heading;
        var deltaLongitude = secondLongitude - firstLongitude;

        var distance = 0.0;

        //Check to see if the rhumb line has constant latitude
        //This equation will diverge if heading gets close to 90 degrees
        if (CesiumMath.equalsEpsilon(Math.abs(heading), CesiumMath.PI_OVER_TWO, CesiumMath.EPSILON8)) { //If heading is close to 90 degrees
            if (major === minor) {
                distance = major * Math.cos(firstLatitude) * CesiumMath.negativePiToPi(deltaLongitude);
            } else {
                var sinPhi = Math.sin(firstLatitude);
                distance = major * Math.cos(firstLatitude) * CesiumMath.negativePiToPi(deltaLongitude) / Math.sqrt(1 - ellipsoidRhumb._ellipticitySquared * sinPhi * sinPhi);
            }
        } else {
            var M1 = calculateM(ellipsoidRhumb._ellipticity, major, firstLatitude);
            var M2 = calculateM(ellipsoidRhumb._ellipticity, major, secondLatitude);

            distance = (M2 - M1) / Math.cos(heading);
        }
        return Math.abs(distance);
    }

    var scratchCart1 = new Cartesian3();
    var scratchCart2 = new Cartesian3();

    function initiailize(ellipsoidRhumb, start, end, ellipsoid) {
        var major = ellipsoid.maximumRadius;
        var minor = ellipsoid.minimumRadius;
        var majorSquared = major * major;
        var minorSquared = minor * minor;
        ellipsoidRhumb._ellipticitySquared = (majorSquared - minorSquared) / majorSquared;
        ellipsoidRhumb._ellipticity = Math.sqrt(ellipsoidRhumb._ellipticitySquared);

        if (defined(start)) {
            ellipsoidRhumb._start = Cartographic.clone(start, ellipsoidRhumb._start);
            ellipsoidRhumb._start.height = 0;
        }
        if (defined(end)) {
            ellipsoidRhumb._end = Cartographic.clone(end, ellipsoidRhumb._end);
            ellipsoidRhumb._end.height = 0;
        }
    }

    function computeProperties(ellipsoidRhumb, start, end, ellipsoid) {
        var firstCartesian = Cartesian3.normalize(ellipsoid.cartographicToCartesian(start, scratchCart2), scratchCart1);
        var lastCartesian = Cartesian3.normalize(ellipsoid.cartographicToCartesian(end, scratchCart2), scratchCart2);

        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number.greaterThanOrEquals('value', Math.abs(Math.abs(Cartesian3.angleBetween(firstCartesian, lastCartesian)) - Math.PI), 0.0125);
        //>>includeEnd('debug');

        initiailize(ellipsoidRhumb, start, end, ellipsoid);

        ellipsoidRhumb._heading = calculateHeading(ellipsoidRhumb, ellipsoid.maximumRadius, ellipsoid.minimumRadius,
                                                   start.longitude, start.latitude, end.longitude, end.latitude);
        ellipsoidRhumb._distance = calculateArcLength(ellipsoidRhumb, ellipsoid.maximumRadius, ellipsoid.minimumRadius,
                                                      start.longitude, start.latitude, end.longitude, end.latitude);
    }

    /**
     * Initializes a rhumb line on the ellipsoid connecting the two provided planetodetic points.
     *
     * @alias EllipsoidRhumb
     * @constructor
     *
     * @param {Cartographic} [start] The initial planetodetic point on the path.
     * @param {Cartographic} [end] The final planetodetic point on the path.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the rhumb line lies.
     */
    function EllipsoidRhumb(start, end, ellipsoid) {
        var e = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._ellipsoid = e;
        this._start = new Cartographic();
        this._end = new Cartographic();

        this._heading = undefined;
        this._distance = undefined;
        this._ellipticity = undefined;
        this._ellipticitySquared = undefined;

        if (defined(start) && defined(end)) {
            computeProperties(this, start, end, e);
        }
    }

    defineProperties(EllipsoidRhumb.prototype, {
        /**
         * Gets the ellipsoid.
         * @memberof EllipsoidRhumb.prototype
         * @type {Ellipsoid}
         * @readonly
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the surface distance between the start and end point
         * @memberof EllipsoidRhumb.prototype
         * @type {Number}
         * @readonly
         */
        surfaceDistance : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                Check.defined('distance', this._distance);
                //>>includeEnd('debug');

                return this._distance;
            }
        },

        /**
         * Gets the initial planetodetic point on the path.
         * @memberof EllipsoidRhumb.prototype
         * @type {Cartographic}
         * @readonly
         */
        start : {
            get : function() {
                return this._start;
            }
        },

        /**
         * Gets the final planetodetic point on the path.
         * @memberof EllipsoidRhumb.prototype
         * @type {Cartographic}
         * @readonly
         */
        end : {
            get : function() {
                return this._end;
            }
        },

        /**
         * Gets the heading from the start point to the end point.
         * @memberof EllipsoidRhumb.prototype
         * @type {Number}
         * @readonly
         */
        heading : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                Check.defined('distance', this._distance);
                //>>includeEnd('debug');

                return this._heading;
            }
        }
    });

    /**
     * Create a rhumb line using an initial and final position.
     *
     * @param {Cartographic} start The initial planetodetic point on the path.
     * @param {Cartographic} end The final planetodetic point on the path.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the rhumb line lies.
     * @param {EllipsoidRhumb} [result] The object in whice to store the result.
     * @returns {EllipsoidRhumb} The EllipsoidRhumb object.
     */
    EllipsoidRhumb.fromStartAndEnd = function(start, end, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('start', start);
        Check.defined('end', end);
        //>>includeEnd('debug');

        var e = defaultValue(ellipsoid, Ellipsoid.WGS84);

        if (defined(result)) {
            result._ellipsoid = e;
            result.setEndPoints(start, end);
            return result;
        }
        return new EllipsoidRhumb(start, end, e);
    };

    /**
     * Create a rhumb line using an initial position with a heading and distance.
     *
     * @param {Cartographic} start The initial planetodetic point on the path.
     * @param {Number} heading The heading in radians.
     * @param {Number} distance The rhumb line distance between the start and end point.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid on which the rhumb line lies.
     * @param {EllipsoidRhumb} [result] The object in whice to store the result.
     * @returns {EllipsoidRhumb} The EllipsoidRhumb object.
     */
    EllipsoidRhumb.fromStartHeadingDistance = function(start, heading, distance, ellipsoid, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('start', start);
        Check.defined('heading', heading);
        Check.defined('distance', distance);
        //>>includeEnd('debug');

        var e = defaultValue(ellipsoid, Ellipsoid.WGS84);

        if (defined(result)) {
            result._ellipsoid = e;
            initiailize(result, start, undefined, e);
            result._heading = CesiumMath.negativePiToPi(heading);
            result._distance = distance;

            result._end = result.interpolateUsingSurfaceDistance(distance, new Cartographic());
            return result;
        }

        var rhumb = new EllipsoidRhumb(undefined, undefined, e);
        initiailize(rhumb, start, undefined, e);
        rhumb._heading = CesiumMath.negativePiToPi(heading);
        rhumb._distance = distance;
        rhumb._end = rhumb.interpolateUsingSurfaceDistance(distance, new Cartographic());

        return rhumb;
    };

    /**
     * Sets the start and end points of the geodesic
     *
     * @param {Cartographic} start The initial planetodetic point on the path.
     * @param {Cartographic} end The final planetodetic point on the path.
     */
    EllipsoidRhumb.prototype.setEndPoints = function(start, end) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('start', start);
        Check.defined('end', end);
        //>>includeEnd('debug');

        computeProperties(this, start, end, this._ellipsoid);
    };

    /**
     * Provides the location of a point at the indicated portion along the rhumb line.
     *
     * @param {Number} fraction The portion of the distance between the initial and final points.
     * @param {Cartographic} result The object in which to store the result.
     * @returns {Cartographic} The location of the point along the rhumb line.
     */
    EllipsoidRhumb.prototype.interpolateUsingFraction = function(fraction, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.number('distance', this._distance);
        //>>includeEnd('debug');

        return this.interpolateUsingSurfaceDistance(fraction * this._distance, result);
    };

    /**
     * Provides the location of a point at the indicated distance along the rhumb line.
     *
     * @param {Number} distance The distance from the inital point to the point of interest along the rhumb.
     * @param {Cartographic} result The object in which to store the result.
     * @returns {Cartographic} The location of the point along the geodesic.
     *
     * @exception {DeveloperError} start and end must be set before calling function interpolateUsingSurfaceDistance
     */
    EllipsoidRhumb.prototype.interpolateUsingSurfaceDistance = function(distance, result) {
        //>>includeStart('debug', pragmas.debug);
        Check.defined('distance', this._distance);
        //>>includeEnd('debug');

        var ellipsoid = this._ellipsoid;
        var major = ellipsoid.maximumRadius;
        var ellipticity = this._ellipticity;
        var ellipticitySquared = this._ellipticitySquared;
        var heading = this._heading;
        var start = this._start;

        var longitude;
        var latitude;
        var deltaLongitude;

        //Check to see if the rhumb line has constant latitude
        //This won't converge if heading is close to 90 degrees
        if (Math.abs(CesiumMath.PI_OVER_TWO - Math.abs(heading)) > CesiumMath.EPSILON8) {
            //Calculate latitude of the second point
            var M1 = calculateM(ellipticity, major, start.latitude);
            var deltaM = distance * Math.cos(heading);
            var M2 = M1 + deltaM;
            latitude = calculateInverseM(M2, ellipticity, major);

            //Now find the longitude of the second point
            var sigma1 = calculateSigma(ellipticity, start.latitude);
            var sigma2 = calculateSigma(ellipticity, latitude);
            deltaLongitude = Math.tan(heading) * (sigma2 - sigma1);
            longitude = CesiumMath.negativePiToPi(start.longitude + deltaLongitude);
        } else { //If heading is close to 90 degrees
            latitude = start.latitude;
            var localRad;

            if (ellipticity === 0.0) { // sphere
                localRad = major * Math.cos(start.latitude);
            } else {
                var sinPhi = Math.sin(start.latitude);
                localRad = major * Math.cos(start.latitude) / Math.sqrt(1 - ellipticitySquared * sinPhi * sinPhi);
            }

            deltaLongitude = distance / localRad;
            if (heading > 0.0) {
                longitude = CesiumMath.negativePiToPi(start.longitude + deltaLongitude);
            } else {
                longitude = CesiumMath.negativePiToPi(start.longitude - deltaLongitude);
            }
        }

        if (defined(result)) {
            result.longitude = longitude;
            result.latitude = latitude;
            result.height = 0;

            return result;
        }

        return new Cartographic(longitude, latitude, 0);
    };

    return EllipsoidRhumb;
});
