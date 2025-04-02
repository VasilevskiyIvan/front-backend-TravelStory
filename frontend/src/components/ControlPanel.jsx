import './ControlPanel-style.css';

export default function ControlPanel() {
    return (
        <div className="control-panel">
            <div className="data-start">
                Старт: .....
            </div>
            <div className="data-end">
                Конец: .....
            </div>
            <div className="search-travel">
                Умный поиск
                <textarea placeholder="Поиск"></textarea>
            </div>
            <div className="control-items">
                Панель управления: .....
            </div>
        </div>
    )
}