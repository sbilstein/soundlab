class AddUpVotesToJams < ActiveRecord::Migration
  def change
    add_column :jams, :up_votes, :integer
  end
end
