import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, Save, RotateCcw, Shuffle, AlertTriangle } from 'lucide-react';

const ReorderQueueModal = ({ isOpen, onClose, queueData, onSaveOrder, saving }) => {
  const [reorderedQueue, setReorderedQueue] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    if (isOpen && queueData?.queues) {
      // Only include drivers that can be reordered (waiting status)
      const reorderableDrivers = queueData.queues
        .filter(driver => driver.status === 'waiting')
        .sort((a, b) => a.position - b.position);
      setReorderedQueue(reorderableDrivers);
      setHasChanges(false);
    }
  }, [isOpen, queueData]);

  const moveDriver = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newQueue = [...reorderedQueue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    
    // Update positions
    const updatedQueue = newQueue.map((driver, index) => ({
      ...driver,
      position: index + 1
    }));
    
    setReorderedQueue(updatedQueue);
    setHasChanges(true);
  };

  const moveUp = (index) => {
    if (index > 0) {
      moveDriver(index, index - 1);
    }
  };

  const moveDown = (index) => {
    if (index < reorderedQueue.length - 1) {
      moveDriver(index, index + 1);
    }
  };

  const shuffleQueue = () => {
    const shuffled = [...reorderedQueue];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const updatedQueue = shuffled.map((driver, index) => ({
      ...driver,
      position: index + 1
    }));
    
    setReorderedQueue(updatedQueue);
    setHasChanges(true);
  };

  const resetOrder = () => {
    if (queueData?.queues) {
      const originalOrder = queueData.queues
        .filter(driver => driver.status === 'waiting')
        .sort((a, b) => a.position - b.position);
      setReorderedQueue(originalOrder);
      setHasChanges(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    const updates = reorderedQueue.map((driver, index) => ({
      id: driver.id,
      position: index + 1
    }));
    
    const result = await onSaveOrder(updates);
    if (result?.success) {
      setHasChanges(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== dropIndex) {
      moveDriver(draggedItem, dropIndex);
    }
    setDraggedItem(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ArrowUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Reorder Queue</h2>
                <p className="text-purple-100 text-sm">
                  Drag and drop or use arrows to reorder drivers
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Queue Info */}
        {queueData && (
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div>Station: {queueData.stationName}</div>
                <div>Schedule: {queueData.scheduleTime}</div>
                <div>Destination: {queueData.destinationName}</div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={shuffleQueue}
                  className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>
                <button
                  onClick={resetOrder}
                  disabled={!hasChanges}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reorderable Queue */}
        <div className="flex-1 overflow-y-auto p-6">
          {reorderedQueue.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Waiting Drivers</h3>
              <p className="text-gray-500">
                Only drivers with "waiting" status can be reordered
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-4">
                <strong>{reorderedQueue.length}</strong> drivers can be reordered
              </div>
              
              {reorderedQueue.map((driver, index) => (
                <div
                  key={driver.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-white border-2 rounded-lg p-4 transition-all cursor-move hover:border-purple-300 ${
                    draggedItem === index ? 'opacity-50 border-purple-500' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* New Position */}
                      <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        #{driver.position}
                      </div>
                      
                      {/* Driver Info */}
                      <div>
                        <div className="font-medium text-gray-900">
                          {driver.driver?.user?.username || `Driver #${driver.driverId?.slice(-8) || 'Unknown'}`}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {driver.driverId?.slice(0, 8)}...
                        </div>
                      </div>
                      
                      {/* Wait Time */}
                      <div className="text-sm text-gray-500">
                        Wait: {Math.round((new Date() - new Date(driver.joinedAt || driver.createdAt)) / (1000 * 60))} min
                      </div>
                    </div>

                    {/* Movement Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === reorderedQueue.length - 1}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-500">
            {hasChanges ? (
              <span className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span>You have unsaved changes</span>
              </span>
            ) : (
              'No changes made'
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReorderQueueModal;