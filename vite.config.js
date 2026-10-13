var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs/promises';
function localCrudPlugin() {
    return {
        name: 'local-crud-plugin',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var dataPath, files_1, walk_1, err_1, url, fileParam, targetPath_1, content, err_2, body_1;
                var _this = this;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (!((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith('/api/local-crud/list'))) return [3 /*break*/, 5];
                            res.setHeader('Content-Type', 'application/json');
                            if (!(req.method === 'GET')) return [3 /*break*/, 4];
                            _c.label = 1;
                        case 1:
                            _c.trys.push([1, 3, , 4]);
                            dataPath = path.resolve(__dirname, 'src/data');
                            files_1 = [];
                            walk_1 = function (dir) { return __awaiter(_this, void 0, void 0, function () {
                                var list, _i, list_1, item, fullPath;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, fs.readdir(dir, { withFileTypes: true })];
                                        case 1:
                                            list = _a.sent();
                                            _i = 0, list_1 = list;
                                            _a.label = 2;
                                        case 2:
                                            if (!(_i < list_1.length)) return [3 /*break*/, 6];
                                            item = list_1[_i];
                                            fullPath = path.join(dir, item.name);
                                            if (!item.isDirectory()) return [3 /*break*/, 4];
                                            return [4 /*yield*/, walk_1(fullPath)];
                                        case 3:
                                            _a.sent();
                                            return [3 /*break*/, 5];
                                        case 4:
                                            if (item.name.endsWith('.json')) {
                                                files_1.push(fullPath.replace(path.resolve(__dirname) + path.sep, '').replace(/\\/g, '/'));
                                            }
                                            _a.label = 5;
                                        case 5:
                                            _i++;
                                            return [3 /*break*/, 2];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            }); };
                            return [4 /*yield*/, walk_1(dataPath)];
                        case 2:
                            _c.sent();
                            return [2 /*return*/, res.end(JSON.stringify({ files: files_1 }))];
                        case 3:
                            err_1 = _c.sent();
                            res.statusCode = 500;
                            return [2 /*return*/, res.end(JSON.stringify({ error: err_1.message }))];
                        case 4: return [2 /*return*/];
                        case 5:
                            if (!((_b = req.url) === null || _b === void 0 ? void 0 : _b.startsWith('/api/local-crud'))) return [3 /*break*/, 10];
                            url = new URL(req.url, "http://".concat(req.headers.host));
                            fileParam = url.searchParams.get('file');
                            if (!fileParam) {
                                res.statusCode = 400;
                                return [2 /*return*/, res.end(JSON.stringify({ error: "Missing file parameter" }))];
                            }
                            targetPath_1 = path.resolve(__dirname, fileParam);
                            if (!targetPath_1.startsWith(__dirname)) {
                                res.statusCode = 403;
                                return [2 /*return*/, res.end(JSON.stringify({ error: "Access denied" }))];
                            }
                            res.setHeader('Content-Type', 'application/json');
                            if (!(req.method === 'GET')) return [3 /*break*/, 9];
                            _c.label = 6;
                        case 6:
                            _c.trys.push([6, 8, , 9]);
                            return [4 /*yield*/, fs.readFile(targetPath_1, 'utf-8')];
                        case 7:
                            content = _c.sent();
                            return [2 /*return*/, res.end(content)];
                        case 8:
                            err_2 = _c.sent();
                            if (err_2.code === 'ENOENT') {
                                res.statusCode = 404;
                                return [2 /*return*/, res.end(JSON.stringify({ error: "File not found" }))];
                            }
                            res.statusCode = 500;
                            return [2 /*return*/, res.end(JSON.stringify({ error: err_2.message }))];
                        case 9:
                            if (req.method === 'PUT' || req.method === 'POST') {
                                body_1 = '';
                                req.on('data', function (chunk) {
                                    body_1 += chunk.toString();
                                });
                                req.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                                    var dir, err_3;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 3, , 4]);
                                                dir = path.dirname(targetPath_1);
                                                return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
                                            case 1:
                                                _a.sent();
                                                return [4 /*yield*/, fs.writeFile(targetPath_1, body_1, 'utf-8')];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/, res.end(JSON.stringify({ success: true }))];
                                            case 3:
                                                err_3 = _a.sent();
                                                res.statusCode = 500;
                                                return [2 /*return*/, res.end(JSON.stringify({ error: err_3.message }))];
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); });
                                return [2 /*return*/];
                            }
                            _c.label = 10;
                        case 10:
                            next();
                            return [2 /*return*/];
                    }
                });
            }); });
        }
    };
}
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        localCrudPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon-192.png', 'icon-512.png', 'all-data.json'],
            manifest: {
                name: 'MyKaado - Japanese Flashcards',
                short_name: 'MyKaado',
                description: 'Belajar bahasa Jepang dengan Spaced Repetition',
                theme_color: '#0A0A0A',
                background_color: '#FAF9F5',
                display: 'standalone',
                orientation: 'portrait-primary',
                icons: [
                    {
                        src: '/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.startsWith('/adminadit') || url.hostname.includes('supabase');
                        },
                        handler: 'NetworkOnly',
                    },
                    {
                        urlPattern: function (_a) {
                            var url = _a.url;
                            return url.pathname.includes('/all-data.json');
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'mykaado-data-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                        },
                    },
                ],
            }
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    }
});
