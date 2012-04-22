class CreateJams < ActiveRecord::Migration
  def change
    create_table :jams do |t|
      t.string :title
      t.binary :song

      t.timestamps
    end
  end
end
