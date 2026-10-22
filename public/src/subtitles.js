window.SubtitleHelper = {
    formatTimeSRT(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss},${ms}`;
    },

    formatTimeVTT(seconds) {
        const date = new Date(seconds * 1000);
        const hh = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');
        const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    },

    toSRT(segments) {
        return segments.map((seg, index) => {
            return `${index + 1}\n${this.formatTimeSRT(seg.start)} --> ${this.formatTimeSRT(seg.end)}\n${seg.translated}\n\n`;
        }).join('');
    },

    toVTT(segments) {
        let vtt = "WEBVTT\n\n";
        vtt += segments.map((seg, index) => {
            return `${index + 1}\n${this.formatTimeVTT(seg.start)} --> ${this.formatTimeVTT(seg.end)}\n${seg.translated}\n\n`;
        }).join('');
        return vtt;
    },

    downloadFile(filename, content, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
};
