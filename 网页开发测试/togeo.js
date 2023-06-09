var toGeoJSON = (function () {
  "use strict";
  function e(e) {
    if (!e || !e.length) return 0;
    for (var t = 0, r = 0; t < e.length; t++) r = ((r << 5) - r + e.charCodeAt(t)) | 0;
    return r;
  }
  function t(e, t) {
    return e.getElementsByTagName(t);
  }
  function r(e, t) {
    return e.getAttribute(t);
  }
  function n(e, t) {
    return parseFloat(r(e, t));
  }
  function i(e, r) {
    var n = t(e, r);
    return n.length ? n[0] : null;
  }
  function o(e) {
    return e.normalize && e.normalize(), e;
  }
  function a(e) {
    for (var t = 0, r = []; t < e.length; t++) r[t] = parseFloat(e[t]);
    return r;
  }
  function s(e) {
    return e && o(e), (e && e.textContent) || "";
  }
  function l(e, t) {
    var r,
      n,
      o = {};
    for (n = 0; n < t.length; n++) (r = i(e, t[n])) && (o[t[n]] = s(r));
    return o;
  }
  function u(e, t) {
    for (var r in t) e[r] = t[r];
  }
  function f(e) {
    return a(e.replace(y, "").split(","));
  }
  function c(e) {
    for (var t = e.replace(d, "").split(v), r = [], n = 0; n < t.length; n++) r.push(f(t[n]));
    return r;
  }
  function g(e) {
    var t,
      r = [n(e, "lon"), n(e, "lat")],
      o = i(e, "ele"),
      a = i(e, "gpxtpx:hr") || i(e, "hr"),
      l = i(e, "time");
    return o && ((t = parseFloat(s(o))), isNaN(t) || r.push(t)), { coordinates: r, time: l ? s(l) : null, heartRate: a ? parseFloat(s(a)) : null };
  }
  function h() {
    return { type: "FeatureCollection", features: [] };
  }
  function p(e) {
    return void 0 !== e.xml ? e.xml : m.serializeToString(e);
  }
  var m,
    y = /\s*/g,
    d = /^\s*|\s*$/g,
    v = /\s+/;
  return (
    "undefined" != typeof XMLSerializer ? (m = new XMLSerializer()) : "object" != typeof exports || "object" != typeof process || process.browser || (m = new (require("xmldom").XMLSerializer)()),
    {
      kml: function (n) {
        function o(e) {
          var t, r;
          return (
            (e = e || ""),
            "#" === e.substr(0, 1) && (e = e.substr(1)),
            (6 !== e.length && 3 !== e.length) || (t = e),
            8 === e.length && ((r = parseInt(e.substr(0, 2), 16) / 255), (t = "#" + e.substr(6, 2) + e.substr(4, 2) + e.substr(2, 2))),
            [t, isNaN(r) ? void 0 : r]
          );
        }
        function l(e) {
          return a(e.split(" "));
        }
        function u(e) {
          var r = t(e, "coord", "gx"),
            n = [],
            i = [];
          0 === r.length && (r = t(e, "gx:coord"));
          for (var o = 0; o < r.length; o++) n.push(l(s(r[o])));
          for (var a = t(e, "when"), u = 0; u < a.length; u++) i.push(s(a[u]));
          return { coords: n, times: i };
        }
        function g(e) {
          var r,
            n,
            o,
            a,
            l,
            h = [],
            p = [];
          if (i(e, "MultiGeometry")) return g(i(e, "MultiGeometry"));
          if (i(e, "MultiTrack")) return g(i(e, "MultiTrack"));
          if (i(e, "gx:MultiTrack")) return g(i(e, "gx:MultiTrack"));
          for (o = 0; o < S.length; o++)
            if ((n = t(e, S[o])))
              for (a = 0; a < n.length; a++)
                if (((r = n[a]), "Point" === S[o])) h.push({ type: "Point", coordinates: f(s(i(r, "coordinates"))) });
                else if ("LineString" === S[o]) h.push({ type: "LineString", coordinates: c(s(i(r, "coordinates"))) });
                else if ("Polygon" === S[o]) {
                  var m = t(r, "LinearRing"),
                    y = [];
                  for (l = 0; l < m.length; l++) y.push(c(s(i(m[l], "coordinates"))));
                  h.push({ type: "Polygon", coordinates: y });
                } else if ("Track" === S[o] || "gx:Track" === S[o]) {
                  var d = u(r);
                  h.push({ type: "LineString", coordinates: d.coords }), d.times.length && p.push(d.times);
                }
          return { geoms: h, coordTimes: p };
        }
        for (
          var m = h(), y = {}, d = {}, v = {}, S = ["Polygon", "LineString", "Point", "Track", "gx:Track"], k = t(n, "Placemark"), T = t(n, "Style"), x = t(n, "StyleMap"), b = 0;
          b < T.length;
          b++
        ) {
          var L = e(p(T[b])).toString(16);
          (y["#" + r(T[b], "id")] = L), (d[L] = T[b]);
        }
        for (var N = 0; N < x.length; N++) {
          y["#" + r(x[N], "id")] = e(p(x[N])).toString(16);
          for (var M = t(x[N], "Pair"), P = {}, F = 0; F < M.length; F++) P[s(i(M[F], "key"))] = s(i(M[F], "styleUrl"));
          v["#" + r(x[N], "id")] = P;
        }
        for (var w = 0; w < k.length; w++)
          m.features = m.features.concat(
            (function (e) {
              var n,
                a = g(e),
                l = {},
                u = s(i(e, "name")),
                f = s(i(e, "styleUrl")),
                c = s(i(e, "description")),
                h = i(e, "TimeSpan"),
                p = i(e, "TimeStamp"),
                m = i(e, "ExtendedData"),
                S = i(e, "LineStyle"),
                k = i(e, "PolyStyle"),
                T = i(e, "visibility");
              if (!a.geoms.length) return [];
              if ((u && (l.name = u), f)) {
                "#" !== f[0] && (f = "#" + f), (l.styleUrl = f), y[f] && (l.styleHash = y[f]), v[f] && ((l.styleMapHash = v[f]), (l.styleHash = y[v[f].normal]));
                var x = d[l.styleHash];
                x && (S || (S = i(x, "LineStyle")), k || (k = i(x, "PolyStyle")));
              }
              if ((c && (l.description = c), h)) {
                var b = s(i(h, "begin")),
                  L = s(i(h, "end"));
                l.timespan = { begin: b, end: L };
              }
              if ((p && (l.timestamp = s(i(p, "when"))), S)) {
                var N = o(s(i(S, "color"))),
                  M = N[0],
                  P = N[1],
                  F = parseFloat(s(i(S, "width")));
                M && (l.stroke = M), isNaN(P) || (l["stroke-opacity"] = P), isNaN(F) || (l["stroke-width"] = F);
              }
              if (k) {
                var w = o(s(i(k, "color"))),
                  R = w[0],
                  z = w[1],
                  G = s(i(k, "fill")),
                  A = s(i(k, "outline"));
                R && (l.fill = R),
                  isNaN(z) || (l["fill-opacity"] = z),
                  G && (l["fill-opacity"] = "1" === G ? l["fill-opacity"] || 1 : 0),
                  A && (l["stroke-opacity"] = "1" === A ? l["stroke-opacity"] || 1 : 0);
              }
              if (m) {
                var C = t(m, "Data"),
                  H = t(m, "SimpleData");
                for (n = 0; n < C.length; n++) l[C[n].getAttribute("name")] = s(i(C[n], "value"));
                for (n = 0; n < H.length; n++) l[H[n].getAttribute("name")] = s(H[n]);
              }
              T && (l.visibility = s(T)), a.coordTimes.length && (l.coordTimes = 1 === a.coordTimes.length ? a.coordTimes[0] : a.coordTimes);
              var D = { type: "Feature", geometry: 1 === a.geoms.length ? a.geoms[0] : { type: "GeometryCollection", geometries: a.geoms }, properties: l };
              return r(e, "id") && (D.id = r(e, "id")), [D];
            })(k[w])
          );
        return m;
      },
      gpx: function (e) {
        function n(e, r) {
          var n = t(e, r),
            i = [],
            o = [],
            a = [],
            s = n.length;
          if (s < 2) return {};
          for (var l = 0; l < s; l++) {
            var u = g(n[l]);
            i.push(u.coordinates), u.time && o.push(u.time), u.heartRate && a.push(u.heartRate);
          }
          return { line: i, times: o, heartRates: a };
        }
        function i(e) {
          var n, i;
          (n = l(e, ["name", "cmt", "desc", "time", "keywords"])), (i = t(e, "link")), i.length && (n.links = []);
          for (var o, a = 0; a < i.length; a++) (o = { href: r(i[a], "href") }), u(o, l(i[a], ["text", "type"])), n.links.push(o);
          return n;
        }
        var o,
          a,
          s = t(e, "trk"),
          f = t(e, "rte"),
          c = t(e, "wpt"),
          p = h();
        for (o = 0; o < s.length; o++)
          (a = (function (e) {
            for (var r, o = t(e, "trkseg"), a = [], s = [], l = [], u = 0; u < o.length; u++)
              (r = n(o[u], "trkpt")) && (r.line && a.push(r.line), r.times && r.times.length && s.push(r.times), r.heartRates && r.heartRates.length && l.push(r.heartRates));
            if (0 !== a.length) {
              var f = i(e);
              return (
                s.length && (f.coordTimes = 1 === a.length ? s[0] : s),
                l.length && (f.heartRates = 1 === a.length ? l[0] : l),
                { type: "Feature", properties: f, geometry: { type: 1 === a.length ? "LineString" : "MultiLineString", coordinates: 1 === a.length ? a[0] : a } }
              );
            }
          })(s[o])) && p.features.push(a);
        for (o = 0; o < f.length; o++)
          (a = (function (e) {
            var t = n(e, "rtept");
            if (t.line) {
              return { type: "Feature", properties: i(e), geometry: { type: "LineString", coordinates: t.line } };
            }
          })(f[o])) && p.features.push(a);
        for (o = 0; o < c.length; o++)
          p.features.push(
            (function (e) {
              var t = i(e);
              return u(t, l(e, ["sym", "type"])), { type: "Feature", properties: t, geometry: { type: "Point", coordinates: g(e).coordinates } };
            })(c[o])
          );
        return p;
      },
    }
  );
})();
"undefined" != typeof module && (module.exports = toGeoJSON);
//# sourceMappingURL=togeojson.min.js.map
