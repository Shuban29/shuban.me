$code = @"
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using System.Security.Cryptography;

public class FastCacheItem {
    public byte[] Data;
    public string MimeType;
    public string ETag;
    public DateTime LastModified;
}

public class FastHttpServer {
    private HttpListener listener;
    private string rootDir;
    private Dictionary<string, FastCacheItem> cache = new Dictionary<string, FastCacheItem>(StringComparer.OrdinalIgnoreCase);
    private Dictionary<string, string> mimes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        { ".html", "text/html; charset=utf-8" },
        { ".htm", "text/html; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".js", "application/javascript; charset=utf-8" },
        { ".json", "application/json; charset=utf-8" },
        { ".png", "image/png" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".gif", "image/gif" },
        { ".svg", "image/svg+xml" },
        { ".pdf", "application/pdf" },
        { ".ttf", "font/ttf" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".ico", "image/x-icon" }
    };

    public FastHttpServer(string dir, string url) {
        this.rootDir = Path.GetFullPath(dir);
        this.listener = new HttpListener();
        this.listener.Prefixes.Add(url);
    }

    public void Preload() {
        foreach (string file in Directory.GetFiles(this.rootDir, "*.*", SearchOption.AllDirectories)) {
            try {
                byte[] bytes = File.ReadAllBytes(file);
                string ext = Path.GetExtension(file);
                string mime = mimes.ContainsKey(ext) ? mimes[ext] : "application/octet-stream";
                string etag;
                using (var md5 = MD5.Create()) {
                    etag = "\"" + BitConverter.ToString(md5.ComputeHash(bytes)).Replace("-", "") + "\"";
                }
                string rel = file.Substring(this.rootDir.Length).Replace('\\', '/').TrimStart('/');
                cache[rel] = new FastCacheItem { Data = bytes, MimeType = mime, ETag = etag, LastModified = File.GetLastWriteTimeUtc(file) };
            } catch {}
        }
    }

    public void Start() {
        Preload();
        listener.Start();
        Console.WriteLine("Server listening at " + string.Join(",", listener.Prefixes));
        listener.BeginGetContext(new AsyncCallback(OnContext), null);
    }

    private void OnContext(IAsyncResult ar) {
        try {
            if (!listener.IsListening) return;
            HttpListenerContext ctx = listener.EndGetContext(ar);
            listener.BeginGetContext(new AsyncCallback(OnContext), null);
            ThreadPool.QueueUserWorkItem(new WaitCallback(HandleRequest), ctx);
        } catch {
            if (listener.IsListening) {
                try { listener.BeginGetContext(new AsyncCallback(OnContext), null); } catch {}
            }
        }
    }

    private void HandleRequest(object state) {
        HttpListenerContext ctx = (HttpListenerContext)state;
        HttpListenerResponse res = ctx.Response;
        try {
            HttpListenerRequest req = ctx.Request;
            string path = req.Url.LocalPath.TrimStart('/');
            if (string.IsNullOrEmpty(path)) path = "index.html";

            FastCacheItem item = null;
            string fullPath = Path.Combine(rootDir, path.Replace('/', Path.DirectorySeparatorChar));
            if (File.Exists(fullPath)) {
                DateTime writeTime = File.GetLastWriteTimeUtc(fullPath);
                lock (cache) {
                    if (cache.ContainsKey(path) && cache[path].LastModified == writeTime) {
                        item = cache[path];
                    } else {
                        byte[] bytes = File.ReadAllBytes(fullPath);
                        string ext = Path.GetExtension(fullPath);
                        string mime = mimes.ContainsKey(ext) ? mimes[ext] : "application/octet-stream";
                        string etag;
                        using (var md5 = MD5.Create()) {
                            etag = "\"" + BitConverter.ToString(md5.ComputeHash(bytes)).Replace("-", "") + "\"";
                        }
                        item = new FastCacheItem { Data = bytes, MimeType = mime, ETag = etag, LastModified = writeTime };
                        cache[path] = item;
                    }
                }
            }

            if (item == null) {
                res.StatusCode = 404;
                byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found");
                res.ContentType = "text/plain";
                res.ContentLength64 = notFound.Length;
                res.OutputStream.Write(notFound, 0, notFound.Length);
                res.Close();
                return;
            }

            string ifNoneMatch = req.Headers["If-None-Match"];
            if (!string.IsNullOrEmpty(ifNoneMatch) && ifNoneMatch == item.ETag) {
                res.StatusCode = 304;
                res.Headers["ETag"] = item.ETag;
                res.Headers["Cache-Control"] = path.EndsWith(".html") ? "no-cache, must-revalidate" : "public, max-age=31536000, immutable";
                res.Close();
                return;
            }

            res.StatusCode = 200;
            res.ContentType = item.MimeType;
            res.ContentLength64 = item.Data.Length;
            res.Headers["ETag"] = item.ETag;
            res.Headers["Accept-Ranges"] = "bytes";
            res.Headers["Access-Control-Allow-Origin"] = "*";
            res.Headers["Cache-Control"] = path.EndsWith(".html") ? "no-cache, must-revalidate" : "public, max-age=31536000, immutable";

            res.OutputStream.Write(item.Data, 0, item.Data.Length);
            res.OutputStream.Flush();
            res.Close();
        } catch {
            try { res.Close(); } catch {}
        }
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp -ErrorAction SilentlyContinue

$currentDir = (Get-Location).Path
$server = New-Object FastHttpServer($currentDir, "http://localhost:8080/")
$server.Start()

Write-Output "FastHttpServer is actively running at http://localhost:8080/"

while ($true) {
    Start-Sleep -Seconds 3600
}
