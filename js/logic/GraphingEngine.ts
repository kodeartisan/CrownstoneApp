

class GraphingEngine {

  calcPath(dataset, group) {
    if (dataset != null) {
      if (dataset.length > 0) {
        var d = [];

        // construct path from dataset
        if (group.options.interpolation.enabled == true) {
          d = this._catmullRom(dataset, group);
        }
        else {
          d = this._r(dataset);
        }
        return d;
      }
    }
  }

  serializePath = function (pathArray, type, inverse) {
    if (pathArray.length < 2) {
      //Too little data to create a path.
      return "";
    }
    var d = type;
    if (inverse) {
      for (var i = pathArray.length - 2; i > 0; i--) {
        d += pathArray[i][0] + "," + pathArray[i][1] + " ";
      }
    }
    else {
      for (var i = 1; i < pathArray.length; i++) {
        d += pathArray[i][0] + "," + pathArray[i][1] + " ";
      }
    }
    return d;
  }

  /**
   * This uses an uniform parametrization of the interpolation algorithm:
   * 'On the Parameterization of Catmull-Rom Curves' by Cem Yuksel et al.
   * @param data
   * @returns {string}
   * @private
   */
  _catmullRomUniform(data) {
    // catmull rom
    var p0, p1, p2, p3, bp1, bp2;
    var d = [];
    d.push([Math.round(data[0].screen_x), Math.round(data[0].screen_y)]);
    var normalization = 1 / 6;
    var length = data.length;
    for (var i = 0; i < length - 1; i++) {

      p0 = (i == 0) ? data[0] : data[i - 1];
      p1 = data[i];
      p2 = data[i + 1];
      p3 = (i + 2 < length) ? data[i + 2] : p2;


      // Catmull-Rom to Cubic Bezier conversion matrix
      //    0       1       0       0
      //  -1/6      1      1/6      0
      //    0      1/6      1     -1/6
      //    0       0       1       0

      //    bp0 = { x: p1.x,                               y: p1.y };
      bp1 = {
        screen_x: ((-p0.screen_x + 6 * p1.screen_x + p2.screen_x) * normalization),
        screen_y: ((-p0.screen_y + 6 * p1.screen_y + p2.screen_y) * normalization)
      };
      bp2 = {
        screen_x: (( p1.screen_x + 6 * p2.screen_x - p3.screen_x) * normalization),
        screen_y: (( p1.screen_y + 6 * p2.screen_y - p3.screen_y) * normalization)
      };
      //    bp0 = { x: p2.x,                               y: p2.y };

      d.push([bp1.screen_x, bp1.screen_y]);
      d.push([bp2.screen_x, bp2.screen_y]);
      d.push([p2.screen_x, p2.screen_y]);
    }

    return d;
  };

  /**
   * This uses either the chordal or centripetal parameterization of the catmull-rom algorithm.
   * By default, the centripetal parameterization is used because this gives the nicest results.
   * These parameterizations are relatively heavy because the distance between 4 points have to be calculated.
   *
   * One optimization can be used to reuse distances since this is a sliding window approach.
   * @param data
   * @param group
   * @returns {string}
   * @private
   */
  _catmullRom(data, group) {
    var alpha = group.options.interpolation.alpha;
    if (alpha == 0 || alpha === undefined) {
      return this._catmullRomUniform(data);
    }
    else {
      var p0, p1, p2, p3, bp1, bp2, d1, d2, d3, A, B, N, M;
      var d3powA, d2powA, d3pow2A, d2pow2A, d1pow2A, d1powA;
      var d = [];
      d.push([Math.round(data[0].screen_x), Math.round(data[0].screen_y)]);
      var length = data.length;
      for (var i = 0; i < length - 1; i++) {

        p0 = (i == 0) ? data[0] : data[i - 1];
        p1 = data[i];
        p2 = data[i + 1];
        p3 = (i + 2 < length) ? data[i + 2] : p2;

        d1 = Math.sqrt(Math.pow(p0.screen_x - p1.screen_x, 2) + Math.pow(p0.screen_y - p1.screen_y, 2));
        d2 = Math.sqrt(Math.pow(p1.screen_x - p2.screen_x, 2) + Math.pow(p1.screen_y - p2.screen_y, 2));
        d3 = Math.sqrt(Math.pow(p2.screen_x - p3.screen_x, 2) + Math.pow(p2.screen_y - p3.screen_y, 2));

        // Catmull-Rom to Cubic Bezier conversion matrix

        // A = 2d1^2a + 3d1^a * d2^a + d3^2a
        // B = 2d3^2a + 3d3^a * d2^a + d2^2a

        // [   0             1            0          0          ]
        // [   -d2^2a /N     A/N          d1^2a /N   0          ]
        // [   0             d3^2a /M     B/M        -d2^2a /M  ]
        // [   0             0            1          0          ]

        d3powA = Math.pow(d3, alpha);
        d3pow2A = Math.pow(d3, 2 * alpha);
        d2powA = Math.pow(d2, alpha);
        d2pow2A = Math.pow(d2, 2 * alpha);
        d1powA = Math.pow(d1, alpha);
        d1pow2A = Math.pow(d1, 2 * alpha);

        A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A;
        B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;
        N = 3 * d1powA * (d1powA + d2powA);
        if (N > 0) {
          N = 1 / N;
        }
        M = 3 * d3powA * (d3powA + d2powA);
        if (M > 0) {
          M = 1 / M;
        }

        bp1 = {
          screen_x: ((-d2pow2A * p0.screen_x + A * p1.screen_x + d1pow2A * p2.screen_x) * N),
          screen_y: ((-d2pow2A * p0.screen_y + A * p1.screen_y + d1pow2A * p2.screen_y) * N)
        };

        bp2 = {
          screen_x: (( d3pow2A * p1.screen_x + B * p2.screen_x - d2pow2A * p3.screen_x) * M),
          screen_y: (( d3pow2A * p1.screen_y + B * p2.screen_y - d2pow2A * p3.screen_y) * M)
        };

        if (bp1.screen_x == 0 && bp1.screen_y == 0) {
          bp1 = p1;
        }
        if (bp2.screen_x == 0 && bp2.screen_y == 0) {
          bp2 = p2;
        }
        d.push([bp1.screen_x, bp1.screen_y]);
        d.push([bp2.screen_x, bp2.screen_y]);
        d.push([p2.screen_x, p2.screen_y]);
      }

      return d;
    }
  };

  /**
   * this generates the SVG path for a r drawing between datapoints.
   * @param data
   * @returns {string}
   * @private
   */
  _r(data) {
    // r
    var d = [];
    for (var i = 0; i < data.length; i++) {
      d.push([data[i].screen_x, data[i].screen_y]);
    }
    return d;
  }
}