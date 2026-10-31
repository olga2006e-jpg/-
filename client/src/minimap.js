const ROOMS = [{ name: 'ЦЕНТРАЛЬНЫЙ ХОЛЛ', code: '00', x: 0, z: 0, color: '#ddbd81' }, { name: 'ЦИФРОВАЯ ЛАБОРАТОРИЯ', code: '01', x: -24, z: 0, color: '#8bc9d5' }, { name: 'МАТЕМАТИЧЕСКАЯ ГОСТИНАЯ', code: '02', x: 0, z: -24, color: '#b3a5ce' }, { name: 'ЛАБОРАТОРИЯ СВЕТА', code: '03', x: 24, z: 0, color: '#a4cbb5' }];
export const BUILDING_ROOMS = ROOMS;
export class MinimapManager {
    constructor() {
        this.mapModal = document.getElementById('map-modal');
        this.locationBadge = document.getElementById('minimap-location-badge');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas?.getContext('2d');
        this.fullMapCanvas = document.getElementById('full-map-canvas');
        this.fullMapCtx = this.fullMapCanvas?.getContext('2d');
        this.currentLocationText = '';
        this.player = { x: 0, z: 0, rotY: 0 };
        this.players = [];
        this.npcs = [];
        this.lastDraw = 0;
        document.getElementById('minimap-expand-btn').onclick = () => this.openFullMap();
        document.getElementById('map-modal-close').onclick = () => this.closeFullMap();
        window.addEventListener('keydown', e => {
            if (document.activeElement?.matches('input,textarea'))
                return;
            if (e.code === 'KeyM' && !document.querySelector('.modal-overlay:not(.hidden):not(#map-modal)')) {
                e.preventDefault();
                this.isFullMapOpen ? this.closeFullMap() : this.openFullMap();
            }
            if (e.code === 'Escape')
                this.closeFullMap();
        });
    }
    get isFullMapOpen() {
        return !this.mapModal.classList.contains('hidden');
    }
    openFullMap() {
        this.mapModal.classList.remove('hidden');
        document.exitPointerLock?.();
        this.onModalStateChange?.(true);
        this.draw('full-map-canvas', true);
    }
    closeFullMap() {
        this.mapModal.classList.add('hidden');
        this.onModalStateChange?.(Boolean(document.querySelector('.modal-overlay:not(.hidden)')));
    }
    update(player, players, npcs) {
        this.player = player;
        this.players = players;
        this.npcs = npcs;
        const now = performance.now();
        if (now - this.lastDraw < 75)
            return;
        this.lastDraw = now;
        const r = ROOMS.find(r => Math.abs(player.x - r.x) <= 12 && Math.abs(player.z - r.z) <= 12);
        const locationText = r ? `${r.code} / ${r.name.toLowerCase()}` : 'Учебный павильон';
        if (this.currentLocationText !== locationText) {
            this.currentLocationText = locationText;
            const badge = this.locationBadge || (this.locationBadge = document.getElementById('minimap-location-badge'));
            if (badge) {
                badge.textContent = locationText;
            }
        }
        this.draw('minimap-canvas', false);
        if (this.isFullMapOpen)
            this.draw('full-map-canvas', true);
    }
    draw(id, full) {
        const isFull = full || id === 'full-map-canvas';
        const canvas = isFull ? (this.fullMapCanvas || (this.fullMapCanvas = document.getElementById('full-map-canvas'))) : (this.minimapCanvas || (this.minimapCanvas = document.getElementById('minimap-canvas')));
        if (!canvas) return;
        const ctx = isFull ? (this.fullMapCtx || (this.fullMapCtx = canvas.getContext('2d'))) : (this.minimapCtx || (this.minimapCtx = canvas.getContext('2d')));
        if (!ctx) return;
        const w = canvas.width, h = canvas.height, s = full ? 6.8 : 2.6, ox = w / 2, oy = full ? h * .65 : h * .68;
        ctx.fillStyle = '#14232a';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#ffffff06';
        for (let x = 0; x < w; x += full ? 24 : 16) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        const X = x => ox + x * s, Z = z => oy + z * s;
        for (const r of ROOMS) {
            const x = X(r.x - 11.5), y = Z(r.z - 11.5);
            ctx.fillStyle = r.color + '12';
            ctx.fillRect(x, y, 23 * s, 23 * s);
            ctx.strokeStyle = r.color + '88';
            ctx.lineWidth = full ? 2 : 1;
            ctx.strokeRect(x, y, 23 * s, 23 * s);
            ctx.fillStyle = r.color;
            ctx.textAlign = 'center';
            ctx.font = `${full ? 23 : 12}px Georgia`;
            ctx.fillText(r.code, X(r.x), Z(r.z) - s * 5);
            if (full) {
                ctx.font = '10px Segoe UI';
                ctx.fillText(r.name, X(r.x), Z(r.z) - s * 2.5);
            }
        }
        for (const mesh of this.npcs) {
            const n = mesh.userData.npcData;
            ctx.fillStyle = n.color;
            ctx.beginPath();
            ctx.moveTo(X(n.x), Z(n.z) - 5);
            ctx.lineTo(X(n.x) + 4, Z(n.z));
            ctx.lineTo(X(n.x), Z(n.z) + 5);
            ctx.lineTo(X(n.x) - 4, Z(n.z));
            ctx.closePath();
            ctx.fill();
        }
        for (const p of this.players) {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(X(p.x), Z(p.z), full ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
            if (full) {
                ctx.font = '11px Segoe UI';
                ctx.fillText(p.username, X(p.x), Z(p.z) - 10);
            }
        }
        ctx.save();
        ctx.translate(X(this.player.x), Z(this.player.z));
        ctx.rotate(-this.player.rotY);
        ctx.fillStyle = '#c2f0f4';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 2);
        ctx.lineTo(-5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        if (full) {
            ctx.fillStyle = '#ddbd81';
            ctx.font = '12px Segoe UI';
            ctx.textAlign = 'center';
            ctx.fillText('СЕЙФ', X(7), Z(9));
        }
    }
}
